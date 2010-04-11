class User(object):
    def __init__(self, server, name):
        self.server = server
        self.name = name
        self.connections = []
        self.channels = []
        
    def add_connection(self, conn):
        self.connections.append(conn)
        conn.user = self
        
    def remove_connection(self, conn):
        self.connections.remove(conn)
        if not self.connections:
            
            # each call to user_disconnected might result in an immediate call
            # to self.channel_unsubscribed, thus modifying self.channels and
            # messing up our loop. So we loop over a copy of self.channels...
            
            for channel in self.channels[:]:
                channel.user_disconnected(self)
        
    def channel_subscribed(self, channel):
        self.channels.append(channel)
        
    def channel_unsubscribed(self, channel):
        self.channels.remove(channel)
        
    def get_name(self):
        return self.name
    
    def send_frame(self, name, args={}, omit=None):
        for conn in self.connections:
            if conn is not omit:
                conn.send_frame(name, args)

    def get_cookie(self, conn=None):
        if conn:
            return conn.get_cookie()
        return ""