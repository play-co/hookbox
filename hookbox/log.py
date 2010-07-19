import logging

def setup_logging(config):
    fmt_string = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    logging.basicConfig(format=fmt_string)
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    formatter = logging.Formatter(fmt_string)
    if config.log_file_err:
        try:
            from logging import handlers
            handler_cls = handlers.WatchedFileHandler
        except:
            handler_cls = logging.FileHandler
        handler = handler_cls(config.log_file_err)
        handler.setFormatter(formatter)
        handler.setLevel(logging.WARN)
        root_logger.addHandler(handler)
    
    if config.log_file_access:
        try:
            from logging import handlers
            handler_cls = handlers.WatchedFileHandler
        except:
            handler_cls = logging.FileHandler
        handler = handler_cls(config.log_file_access)
        handler.setFormatter(formatter)
        handler.setLevel(logging.INFO)
        logging.getLogger('access').addHandler(handler)
