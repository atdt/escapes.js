# -*- python -*-
"""
$Id: terminal.py 14 2008-11-20 13:47:34Z alexios $

Copyright (C) 2008 Alexios Chouchoulas

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2, or (at your option)
any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software Foundation,
Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.
"""


from util import maybe_int


class TerminalEmulator (object):
    """
    Define a terminal emulator.
    """
    def __init__ (self, framebuffer):
        self.fb = framebuffer


    def write (self, string):
        """
        Send a string to the framebuffer.
        """
        raise NotImplemented ('Abstract method')


class ANSITerminalEmulator (TerminalEmulator):
    """
    A minimal (PC-like) ANSI X.364 terminal emulator.
    """
    # States for the terminal state machine.
    OUTSIDE = 0
    ESC = 1
    ESCBKT = 2

    # Ingored characters
    IGNORED_CHARS = [
        7,                              # BEL
        13,                             # CR (we use NL for newlines)
        14,                             # SO
        15,                             # SI
        26                              # SUB
        ]

    # The order of CGA colours.
    _CGAColours = [0, 4, 2, 6, 1, 5, 3, 7]


    def __init__ (self, framebuffer):
        TerminalEmulator.__init__ (self, framebuffer)
        self.state = self.OUTSIDE
        self.stored_pos = None
        self.params = ''


    def write (self, string):
        """
        Decode ANSI escape sequences and send the string to the framebuffer.

        The encoding of the string is left as-is (pure binary).
        """
        for char in string:
            {
                # Process characters
                self.OUTSIDE: self.handle_outside,

                # Process characters after an ESC
                self.ESC: self.handle_esc,

                # Process an ESC [ sequence.
                self.ESCBKT: self.handle_escbkt,
             }.get (self.state)(char)


    def handle_outside (self, char):
        """
        Handle characters in OUTSIDE state (printing).
        """
        char = ord (char)

        # Backspace
        if char == 8:
            self.fb.goLeft()
            return

        # Delete
        if char == 127:
            # Should we handle this some other way?
            self.fb.goLeft()
            return

        # Newline
        if char == 10:
            self.fb.cr()
            self.fb.nl()
            return

        # Characters to ignore
        if char in self.IGNORED_CHARS:
            return

        # ESC
        if char == 27:
            self.state = self.ESC
            return

        # Print all other characters. Too naive perhaps?
        self.fb.putc (char)


    def handle_esc (self, char):
        """
        Handle characters after an ESC.
        """
        # ESC [
        if char == '[':
            self.params = ''
            self.state = self.ESCBKT
            return

        # Unescape -- what's this?
        if char in "\030\031":
            self.state = self.OUTSIDE
            return

        # Anything else, we stay in this mode, dropping characters.


    def handle_escbkt (self, char):
        """
        Handle characters after an ESC.
        """
        # Move up: ESC [ [num] A
        if char == 'A':
            self.fb.goUp (maybe_int (self.params, 1))
            self.state = self.OUTSIDE

        # Move down: ESC [ [num] B   or   ESC [ [num] B
        elif char in 'Be':
            self.fb.goDown (maybe_int (self.params, 1))
            self.state = self.OUTSIDE

        # Move right: ESC [ [num] C   or   ESC [ [num] a
        elif char in 'Ca':
            #debug ('ESC [ %s C, current=%s' % (self.params, self.fb.where()))
            self.fb.goRight (maybe_int (self.params, 1))
            #debug ('ESC [ %s C, NOW    =%s' % (self.params, self.fb.where()))
            self.state = self.OUTSIDE

        # Move left: ESC [ [num] D
        elif char == 'D':
            self.fb.goLeft (maybe_int (self.params, 1))
            self.state = self.OUTSIDE

        # Go to row (absolute): ESC [ [num] d
        elif char in 'd`':
            # Rows are 1-based, we're 0-based.
            row = maybe_int (self.params, 1) - 1
            self.fb.goto (0, row)
            self.state = self.OUTSIDE

        # Go to beginning of row (relative down): ESC [ [num] E
        elif char in 'E`':
            self.fb.goDown (maybe_int (self.params, 1))
            self.fb.cr()
            self.state = self.OUTSIDE

        # Go to beginning of row (relative up): ESC [ [num] F
        elif char in 'F`':
            self.fb.goUp (maybe_int (self.params, 1))
            self.fb.cr()
            self.state = self.OUTSIDE

        # Go to column: ESC [ [num] G   or   ESC [ [num] `
        elif char in 'G`':
            x, y = self.fb.where()
            # Columns are 1-based, we're 0-based.
            col = maybe_int (self.params, 1) - 1
            self.fb.goto (col, y)
            self.state = self.OUTSIDE

        # Clear screen: ESC [ J
        elif char == 'J':
            self.fb.clrscr()
            # PC ANSI also homes the cursor here.
            self.fb.home()
            self.state = self.OUTSIDE

        # Go to absolute (1-based) co-ordinates: ESC [ [y ; x] H
        elif char == 'H':
            params = self.params.split (';')
            if len (params) == 2:
                y, x = params
            elif len (params) == 1:
                y, x = params, ''
            else:
                y, x = '', ''

            self.fb.goto (maybe_int (x, 1) - 1, maybe_int (y, 1) - 1)
            self.state = self.OUTSIDE

        # Store cursor position: ESC [ s
        elif char == 's':
            self.stored_pos = self.fb.where()
            self.state = self.OUTSIDE

        # Retrieve cursor position: ESC [ u
        elif char == 'u':
            if self.stored_pos is not None:
                self.fb.goto (self.stored_pos[0], self.stored_pos[1])
            self.state = self.OUTSIDE

        # Set attribute: ESC [ num ; num ; ... m
        elif char in 'm':
            self.handle_esc_m()
            self.state = self.OUTSIDE

        #if self.state == self.OUTSIDE:
        #    debug ('  ESC [ %s: params "%s"' % (char, self.params))

        # Otherwise, keep adding.
        self.params += char


    def handle_esc_m (self):
        """
        Handle the parameters in an ESC [ m directive.
        """
        for param in self.params.split (';'):
            param = maybe_int (param)
            #debug ('    ESC [ m: param %d' % param)
            # Invalid parameter.
            if param is None:
                continue

            # Reset to defaults.
            if param == 0:
                self.fb.fg = self.fb.GREY
                self.fb.bg = self.fb.BLACK
                self.fb.attr = self.fb.PLAIN

            # Turn on intense bit.
            elif param == 1:
                self.fb.fg |= self.fb.INTENSE

            # Turn off intense bit (not really supported in PC ANSI, but
            # can't hurt).
            elif param in [2, 21, 22]:
                self.fb.fg |= ~self.fb.INTENSE

            # Blink. We just use bright backgrounds (the standard VGA
            # behaviour when blink is off).
            elif param == 5:
                self.fb.bg |= self.fb.INTENSE

            # Blink off. Just turn off background intensity.
            elif param == 25:
                self.fb.bg &= ~self.fb.INTENSE

            # Inverse on.
            elif param == 7:
                self.fb.attr |= self.fb.INVERSE

            # Inverse off.
            elif param == 27:
                self.fb.attr &= ~self.fb.INVERSE

            # Set foreground colour (only first 8 colours accessible)
            elif param in xrange (30, 38):
                self.fb.fg = (self.fb.fg & self.fb.INTENSE) | self._toCGA (param - 30)

            # Set background colour (only first 8 colours accessible)
            elif param in xrange (40, 48):
                self.fb.bg = (self.fb.bg & self.fb.INTENSE) | self._toCGA (param - 40)

            # Set bright foreground colour (only last 8 colours accessible)
            elif param in xrange (90, 98):
                self.fb.fg = self._toCGA (param - 82)

            # Set bright background colour (only last 8 colours accessible)
            elif param in xrange (100, 108):
                self.fb.fg = self._toCGA (param - 92)


    def _toCGA (self, x):
        """
        Change an ANSI X.364 colour index to a CGA colour index.
        """
        return self._CGAColours [x]


# End of file.
