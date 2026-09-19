# Pasteport CLI (Python) — `pasteport-zisphere`

Cross-device clipboard and file sharing for terminals, shell scripts, and CI/CD pipelines.

## Installation

```bash
# Install via pip
pip install pasteport-zisphere

# Or install from source:
pip install ./python
```

## Quickstart

```bash
# Launch interactive menu (options 1, 2, 3, 4)
pasteport

# Send text snippet
pasteport send "hello from terminal"

# Send file with PIN
pasteport send ./package.json --pin 1234

# Retrieve by code or web URL
pasteport get 482193
pasteport get https://pasteport.zain-imran.com/view/482193

# Wipe / Delete
pasteport delete 482193 --pin 9999
```

## Uninstallation
```bash
pip uninstall pasteport-zisphere
```
