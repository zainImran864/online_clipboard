from setuptools import setup, find_packages

setup(
    name="pasteport-zisphere",
    version="1.0.0",
    description="Cross-device clipboard and file sharing CLI tool for Pasteport",
    author="Zain Imran",
    url="https://pasteport.zain-imran.com",
    packages=find_packages(),
    entry_points={
        "console_scripts": [
            "pasteport = pasteport_zisphere.cli:main",
            "pasteport-zisphere = pasteport_zisphere.cli:main",
        ],
    },
    python_requires=">=3.8",
    classifiers=[
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Programming Language :: Python :: 3.13",
    ],
)
