
import sys
import os

# Get the path to the directory containing this file (backend/tests)
current_dir = os.path.dirname(os.path.abspath(__file__))

# Get the parent directory (backend)
parent_dir = os.path.dirname(current_dir)

# Add the parent directory to sys.path
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
