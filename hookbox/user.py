class User(object):
    def __init__(self, server, name):
        self.server = server
        self.name = name
        self.connections = []
        
    def add_connection(self, conn):
        self.connections.append(conn)
        conn.user = self
        
    def remove_connection(self, conn):
        self.connections.remove(conn)
        
    def get_name(self):
        return self.name
    
    def send_frame(self, name, args={}):
        for conn in self.connections:
            conn.send_frame(name, args)
