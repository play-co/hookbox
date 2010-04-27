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
        self.channel_list_watchers = []
        self.user_list_watchers = []
        
    def __call__(self, environ, start_response):
        return self._wsgi_app(environ, start_response)
    
    def _run(self):
        self._rtjp_server.listen(sock=self._csp)
        while True:
            try:
                rtjp_conn = self._rtjp_server.accept().wait()
                print 'got rtjp conn'
                conn = AdminProtocol(self, rtjp_conn, self.config)
            except:
                break

    def login(self, conn):
        self.conns.append(conn)
        
    def logout(self, conn):
        self.conns.append(conn)

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
        if name not in self.watched_channels:
            self.watched_channels[name] = []
        self.watched_channels[name].append(conn)
        if self.server.exists_channel(name):
            chan = self.server.get_channel(None, name)
            conn.send_frame('CHANNEL_EVENT', { 'name': name, 'type': 'create_channel', 'data': chan.serialize()})
    
    def unwatch_channel(self, name, conn):
        self.watched_channels[name].remove(conn)
        if not self.watched_channels[name]:
            del self.watched_channels[name]

    def watch_channel_list(self, conn):
        self.channel_list_watchers.append(conn)
        conn.send_frame('CHANNEL_LIST', { 'channels': self.server.channels.keys() })
        
    def unwatch_channel_list(self, conn):
        self.channel_list_watchers.remove(conn)

    def user_event(self, event_type, data):
        if event_type == 'connect':
            for conn in self.user_list_watchers:
                conn.send_frame('USER_CONNECT', data)
        if event_type == 'disconnect':
            for conn in self.user_list_watchers:
                conn.send_frame('USER_DISCONNECT', data)

    def watch_user_list(self, conn):
        self.user_list_watchers.append(conn)
        conn.send_frame('USER_LIST', { 'users': self.server.users.keys() })
        
    def unwatch_user_list(self, conn):
        self.user_list_watchers.remove(conn)



class AdminProtocol(object):
    logger = logging.getLogger('AdminProtocol')
    
    def __init__(self, admin_app, rtjp_conn, config):
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
#                print 'frame', fid, fname, fargs
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
            
            
