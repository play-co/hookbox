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

_install_requires = [
    'csp>=0.1alpha10', 
    'rtjp>=0.1alpha2', 
    'eventlet', 
    'paste', 
    'static',
#    'nose==0.11.1',
#    'coverage',
]

# python <= 2.5
if sys.version_info[1] <= 5:
    _install_requires.append('simplejson')


def find_package_data():
    targets = [ 
        os.path.join('hookbox', 'static'),
        os.path.join('hookbox', 'admin', 'static')
    ]
    package_data = {'': reduce(list.__add__, [ '.git' not in d and [ os.path.join(d[len('hookbox/'):], e) for e in
            static_types ] or [] for (d, s, f) in reduce(list.__add__, [ [ i for i in os.walk(target) ] for target in targets ])
        ]) }
    return package_data

setup(
    name='hookbox',
    version='0.2.2',
    author='Michael Carter',
    author_email='CarterMichael@gmail.com',
    url='http://hookbox.org',
    license='MIT License',
    description='HookBox is a Comet server and message queue that tightly integrates with your existing web application via web hooks and a REST interface.',
    long_description='',
    packages= find_packages(),
    package_data = find_package_data(),
    zip_safe = False,
    install_requires = _install_requires,
    entry_points = '''    
        [console_scripts]
        hookbox = hookbox.start:main
    ''',
    
    classifiers = [
        'Development Status :: 4 - Beta',
        'Environment :: Console',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Topic :: Software Development :: Libraries :: Python Modules'
    ],        
)
