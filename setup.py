from setuptools import setup, find_packages
import os, sys

static_types = [
    '*.js', 
    '*.html',
    '*.css', 
    '*.ico', 
    '*.gif', 
    '*.jpg', 
    '*.png', 
    '*.txt*',
    '*.py',
    '*.template'
]

#if sys.platform != "win32":
#    _install_requires.append("Twisted")

setup(
    name='hookbox',
    version='0.1a2',
    author='Michael Carter',
    author_email='CarterMichael@gmail.com',
    license='MIT License',
    description='HookBox is a Comet server and message queue that tightly integrates with your existing web application via web hooks and a REST interface.',
    long_description='',
    packages= find_packages(),
    package_data = {'': reduce(list.__add__, [ '.git' not in d and [ os.path.join(d[len('hookbox')+1:], e) for e in
            static_types ] or [] for (d, s, f) in os.walk(os.path.join('hookbox', 'static'))
        ]) },
    zip_safe = False,
    install_requires = ['csp', 'eventlet'],
    entry_points = '''    
        [console_scripts]
        hookbox = hookbox.start:main
    ''',
    
    classifiers = [
        'Development Status :: 3 - Alpha',
        'Environment :: Console',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Topic :: Software Development :: Libraries :: Python Modules'
    ],        
)
