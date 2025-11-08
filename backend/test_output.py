#!/usr/bin/env python
import sys
print("Testing output", file=sys.stdout)
print("Testing stderr", file=sys.stderr)
sys.stdout.flush()
sys.stderr.flush()
