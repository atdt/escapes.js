"""
Basic ARK Python coding style standards.

$Id: bedroomlan.py 14 2008-11-20 13:47:34Z alexios $
"""

import re

from pylint.interfaces import IRawChecker
from pylint.checkers import BaseChecker

class EndOfFileMarkerChecker (BaseChecker):
    """check for the '# End of file' marker at the appropriate place.
    """

    __implements__ = IRawChecker

    name = 'custom_raw'
    msgs = {'W8901': ('Missing "# End of file" from end of file.',
                      ('Used when the "# End of file" marker is missing from the end of file.')),
            'W8902': ('Marker "# End of file" is not at end of file.',
                      ('Used when the "# End of file" marker is not at the very end of a file.')),
            'W8903': ('SVN keyword $' + 'Id$ missing.',
                      ('Used when the SVN keyword $' + 'Id$ (or its expanded form) is missing from the file.')),
            'W8904': ('Trailing white space.',
                      ('Used when there is leftover white space at the end of a line.')),
            }
    options = ()

    def process_module(self, stream):
        """process a module

        the module's content is accessible via the stream object
        """
        found_eof = False
        found_id = False
        eof_not_at_end = 0
        lines = 0
        for (lineno, line) in enumerate(stream):
            lines = lineno + 1
            if line.endswith('\n'):
                line = line [:-1]
            if re.search ('\S\s+$', line):
                self.add_message('W8904', line=lines)
            if line.find ('$' + 'Id$') >= 0 or line.find ('$' + 'Id: ') >= 0:
                found_id = True
            if re.match ('^#\s*End [Oo]f [Ff]ile.?\s*', line.rstrip()):
                found_eof = True
            elif found_eof:
                if line.rstrip():
                    eof_not_at_end += 1
                else:
                    eof_not_at_end += 2
                if eof_not_at_end > 1:
                    self.add_message('W8902', line=lines)
        if not found_eof:
            self.add_message('W8901', line=lines)
        if not found_id:
            self.add_message('W8903', line=lines)

def register(linter):
    """required method to auto register this checker"""
    linter.register_checker(EndOfFileMarkerChecker(linter))

# End of file.
