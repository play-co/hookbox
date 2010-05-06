import os
from paste import urlmap
import static
import csp.eventlet as csp
import rtjp.errors
import eventlet
import logging
from hookbox.errors import ExpectedException

class StopLoop(Exception):
    pass


class HookboxAdminApp(object):
    
    def __init__(self, server, config):
        self.config = config
        self.server = server
        self._wsgi_app = urlmap.URLMap()
        self._csp = csp.Listener()
        self._wsgi_app['/csp'] = self._csp
        static_path = os.path.join(os.path.split(os.path.abspath(__file__))[0], 'static')        
        self._wsgi_app['/'] = static.Cling(static_path)
        self._rtjp_server = rtjp.eventlet.RTJPServer()
        eventlet.spawn(self._run)
        self.conns = []
        self.watched_channels = {}
        self.watched_users = {}
        self.watched_connections = {}
        self.channel_list_watchers = []
        self.user_list_watchers = []
        self.watching_index = {}
        
    def __call__(self, environ, start_response):
        return self._wsgi_app(environ, start_response)
    
    def _run(self):
        self._rtjp_server.listen(sock=self._csp)
        while True:
            try:
                rtjp_conn = self._rtjp_server.accept().wait()
                conn = AdminProtocol(self, rtjp_conn, self.config)
            except:
                raise
                break

    def login(self, conn):
        self.conns.append(conn)
        
    def logout(self, conn):
        self.conns.remove(conn)
        for (type, key) in self.watching_index.get(conn.id, [])[:]:
            print 'unwatch_' + type, key, conn
            if key is not None:
                getattr(self, 'unwatch_' + type)(key, conn)
            else:
                getattr(self, 'unwatch_' + type)(conn)
                
        del self.watching_index[conn.id]
        print self.__dict__
    def channel_event(self, event_type, channel_name, data):
        if event_type == 'create_channel':
            for conn in self.channel_list_watchers:
                conn.send_frame('CREATE_CHANNEL', { 'name': channel_name, 'data': data })
        if event_type == 'destroy_channel':
            for conn in self.channel_list_watchers:
                conn.send_frame('DESTROY_CHANNEL', { 'name': channel_name, 'data': data })
                
        if channel_name not in self.watched_channels:
            return
        for conn in self.watched_channels[channel_name]:
            conn.send_frame('CHANNEL_EVENT', { 'name': channel_name, 'type': event_type, 'data': data })

    def event(self, name, data):
        for conn in self.conns:
            conn.send_frame('EVENT', { 'name': name, 'data': data })


    def watch_channel(self, name, conn):
        self.add_watch_index(conn, 'channel', name)
        if name not in self.watched_channels:
            self.watched_channels[name] = []
        self.watched_channels[name].append(conn)
        if self.server.exists_channel(name):
            chan = self.server.get_channel(None, name)
            conn.send_frame('CHANNEL_EVENT', { 'name': name, 'type': 'create_channel', 'data': chan.serialize()})
    
    def unwatch_channel(self, name, conn):
        self.del_watch_index(conn, 'channel', name)
        self.watched_channels[name].remove(conn)
        if not self.watched_channels[name]:
            del self.watched_channels[name]


    def add_watch_index(self, conn, type, key=None):
        if conn.id not in self.watching_index:
            self.watching_index[conn.id] = []
        self.watching_index[conn.id].append((type, key))
        
    def del_watch_index(self, conn, type, key=None):
        self.watching_index[conn.id].remove((type, key))

    def watch_user(self, name, conn):
        self.add_watch_index(conn, 'user', name)
        if name not in self.watched_users:
            self.watched_users[name] = []
        self.watched_users[name].append(conn)
        if self.server.exists_user(name):
            user = self.server.get_user(name)
            conn.send_frame('USER_EVENT', { 'name': name, 'type': 'create', 'data': user.serialize()})
    
    def unwatch_user(self, name, conn):
        self.del_watch_index(conn, 'user', name)
        self.watched_users[name].remove(conn)
        if not self.watched_users[name]:
            del self.watched_users[name]

    def watch_connection(self, id, admin_conn):
        self.add_watch_index(admin_conn, 'connection', id)
        if id not in self.watched_connections:
            self.watched_connections[id] = []
        self.watched_connections[id].append(admin_conn)
        conn = self.server.get_connection(id)
        if conn:
            admin_conn.send_frame('CONNECTION_EVENT', { 'id': id, 'type': 'connect', 'data': conn.serialize()});
        else:
            admin_conn.send_frame('CONNECTION_EVENT', { 'id': id, 'type': 'disconnect' });
            
    def unwatch_connection(self, id, admin_conn):
        self.del_watch_index(admin_conn, 'connection', id)
        self.watched_connections[id].remove(admin_conn)
        if not self.watched_connections[id]:
            del self.watched_connections[id]

    def connection_event(self, event_type, id, data):
        if id not in self.watched_connections:
            return
        for conn in self.watched_connections[id]:
            conn.send_frame('CONNECTION_EVENT', { 'id': id, 'type': event_type, 'data': data })
        
    def watch_channel_list(self, conn):
        self.add_watch_index(conn, 'channel_list')
        self.channel_list_watchers.append(conn)
        conn.send_frame('CHANNEL_LIST', { 'channels': self.server.channels.keys() })
        
    def unwatch_channel_list(self, conn):
        self.del_watch_index(conn, 'channel_list')
        self.channel_list_watchers.remove(conn)

    def user_event(self, event_type, username, data):
        if event_type == 'create':
            for conn in self.user_list_watchers:
                conn.send_frame('USER_CONNECT', { 'name': username })
        if event_type == 'destroy':
            for conn in self.user_list_watchers:
                conn.send_frame('USER_DISCONNECT', { 'name': username })
        if username not in self.watched_users:
            return
        for conn in self.watched_users[username]:
            conn.send_frame('USER_EVENT', { 'name': username, 'type': event_type, 'data': data })

    def watch_user_list(self, conn):
        self.add_watch_index(conn, 'user_list')
        self.user_list_watchers.append(conn)
        conn.send_frame('USER_LIST', { 'users': self.server.users.keys() })
        
    def unwatch_user_list(self, conn):
        self.del_watch_index(conn, 'user_list')
        self.user_list_watchers.remove(conn)


admin_id = 0
class AdminProtocol(object):
    _id = 0
    logger = logging.getLogger('AdminProtocol')
    def __init__(self, admin_app, rtjp_conn, config):
        AdminProtocol._id += 1
        self.id = AdminProtocol._id
        self.config = config
        self.hookbox = admin_app.server
        self._rtjp_conn = rtjp_conn
        self._admin_app = admin_app
        self._loop = None
        self.logged_in = False
        eventlet.spawn(self._run)
        
    def get_name(self):
        return 'admin'
        
    def frame_LOGIN(self, id, args):
        if self.logged_in:
            raise ExpectedException("Already logged in")
        if not self.config['admin_password'] or self.config['admin_password'] != args['password']:
            raise ExpectedException("Invalid admin password")
        self.logged_in = True
        self._admin_app.login(self)
        self.send_frame("CONNECTED")
        self.start_loop('overview')
        
    def frame_SWITCH(self, id, args):
        self.start_loop(args['location'], args)
        
    def frame_PUBLISH(self, id, args):
        channel_name = args.get('channel_name', None)
        if not self.hookbox.exists_channel(channel_name):
            return
        channel = self.hookbox.get_channel(None, channel_name)
        channel.publish(self, args.get('payload', None), needs_auth=False)
    
    def frame_UNSUBSCRIBE(self, id, args):
        channel_name = args.get('channel_name', None)
        if not self.hookbox.exists_channel(channel_name):
            return
        channel = self.hookbox.get_channel(None, channel_name)
        
        user = self.hookbox.get_user(args.get('user', None))
        if not user:
            return
        channel.unsubscribe(user, needs_auth=False)
        
    def frame_SET_CHANNEL_INFO(self, id, args):
        channel_name = args.pop('channel_name', None)
        
        options = {}
        for k, v in args.iteritems():
            options[str(k)] = v

        channel = self.hookbox.get_channel(None, channel_name)
        channel.update_options(**options)
        
    def start_loop(self, name, args=None):
        if self._loop:
            self._loop.kill()
        self._loop = eventlet.spawn(getattr(self, 'loop_' + name), args)
        
        
    def loop_overview(self, args):
        while True:
            self.send_frame('OVERVIEW', {
                'num_users': len(self.hookbox.users),
                'num_channels': len(self.hookbox.channels)
            })
            eventlet.sleep(1)

    def loop_watch_channel(self, args):
        channel_name = args['channel_name']
        self._admin_app.watch_channel(channel_name, self)
        try:
            while True:
                eventlet.sleep(1)
        finally:
            self._admin_app.unwatch_channel(args['channel_name'], self)

    def loop_watch_user(self, args):
        username = args['user']
        self._admin_app.watch_user(username, self)
        try:
            while True:
                eventlet.sleep(100)
        finally:
            self._admin_app.unwatch_user(username, self)
            

    def loop_watch_connection(self, args):
        connection_id = args['connection_id']
        self._admin_app.watch_connection(connection_id, self)
        try:
            while True:
                eventlet.sleep(100)
        finally: 
            self._admin_app.unwatch_connection(connection_id, self)

    def loop_channel_list(self, args):
        self._admin_app.watch_channel_list(self)
        try:
            while True:
                eventlet.sleep(1)
        finally:
            self._admin_app.unwatch_channel_list(self)

    def loop_user_list(self, args):
        self._admin_app.watch_user_list(self)
        try:
            while True:
                eventlet.sleep(1)
        finally:
            self._admin_app.unwatch_user_list(self)
    

    def send_frame(self, *args, **kw):
        return self._rtjp_conn.send_frame(*args, **kw)

    def send_error(self, *args, **kw):
        return self._rtjp_conn.send_error(*args, **kw)
        
    def _run(self):
        while True:
            try:
                fid, fname, fargs= self._rtjp_conn.recv_frame().wait()
            except rtjp.errors.ConnectionLost, e:
                break
            except:
                self.logger.warn("Error reading frame", exc_info=True)
                continue
            f = getattr(self, 'frame_' + fname, None)
            if f:
                try:
                    f(fid, fargs)
                except ExpectedException, e:
                    self.send_error(fid, e)
                except Exception, e:
                    self.logger.warn("Unexpected error: %s", e, exc_info=True)
                    self.send_error(fid, e)
            else:
                self._default_frame(fid, fname, fargs)
        self._admin_app.logout(self)
            
