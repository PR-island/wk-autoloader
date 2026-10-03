#!/usr/bin/env python3
"""Both home pages are installed by the WK installer, only when missing.
elfldr takes one ELF, so autoload sends only the launcher the user picked.
"""
import sys
print("skip extra pre-send; installer already installs both pages once")
sys.exit(0)
