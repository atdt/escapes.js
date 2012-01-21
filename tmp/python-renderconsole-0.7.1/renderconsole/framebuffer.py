#! -*- python -*-
"""
$Id: framebuffer.py 14 2008-11-20 13:47:34Z alexios $

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


from util import debug, in_range


class Char (dict):
    """
    This is used for exchanging data between Framebuffers and Screens.
    """
    fg = property (fget=lambda self: self ['fg'])
    bg = property (fget=lambda self: self ['bg'])
    attr = property (fget=lambda self: self ['attr'])
    char = property (fget=lambda self: self ['char'])


class Framebuffer (object):
    """
    Simulate a VGA-like terminal.
    """

    # The standard CGA colours.
    BLACK = 0
    BLUE = 1
    GREEN = 2
    CYAN = 3
    RED = 4
    MAGENTA = 5
    BROWN = 6
    GREY = 7
    GRAY = 7                            # Merkin alias

    DARK_GREY = 8
    DARK_GRAY = 8                       # Merkin alias
    LIGHT_BLUE = 9
    LIGHT_GREEN = 10
    LIGHT_CYAN = 11
    LIGHT_RED = 12
    LIGHT_MAGENTA = 13
    YELLOW = 14
    WHITE = 15

    # Orred with standard colours to produce intense versions.
    INTENSE = 8

    # Attributes.
    PLAIN = 0
    INVERSE = 1


    def __init__ (self, width, height, growable=False):
        self.width = width
        self.height = 0
        self.growable = growable
        self.wrapped = False

        # Set the default (clear screen) attributes
        self.bg, self.fg, self.attr = self.BLACK, self.GREY, 0

        self.cursor = None
        self.data = []
        for line in xrange (height):
            self.grow()

        debug ("Created %dx%d virtual screen." % (self.width, self.height))

        self.goto (0, 0)


    @property
    def bg(*args, **kwargs):
        print "bg set: ", args, kwargs

    @property
    def fg(*args, **kwargs):
        print "fg set: ", args, kwargs
    def c (self, char, fg=None, bg=None, attr=None):
        """
        Yield a character tuple. Use defaults.
        """
        return (char, bg or self.bg, fg or self.fg, attr or self.attr)


    def grow (self, char=32, fg=None, bg=None, attr=None):
        """
        Add an extra line at the bottom of this terminal.
        """
        c = self.c (char, fg=fg, bg=bg, attr=attr)
        self.data.append ([ c for _ in xrange (self.width) ])
        self.height += 1


    def scroll (self):
        """
        Scroll the terminal, unless it's a growable terminal, in which
        case we just add another line.
        """
        if self.growable:
            self.grow()
        else:
            self.data = self.data [1:]
            self.height -= 1
            self.grow()
            self.goUp()
            self.clreol()


    def goto (self, x, y):
        """
        Home the cursor.
        """
        x = in_range (x, 0, self.width)
        y = in_range (y, 0, self.height)
        self.cursor = (x, y)


    def goUp (self, d=1):
        """
        Move the cursor up.
        """
        x, y = self.cursor
        self.cursor = (x, in_range (y - d, 0, self.height))


    def goDown (self, d=1):
        """
        Move the cursor down.
        """
        x, y = self.cursor
        self.cursor = (x, in_range (y + d, 0, self.height))


    def goLeft (self, d=1):
        """
        Move the cursor left.
        """
        x, y = self.cursor
        self.cursor = (in_range (x - d, 0, self.width), y)


    def goRight (self, d=1):
        """
        Move the cursor right.
        """
        x, y = self.cursor
        self.cursor = (in_range (x + d, 0, self.width), y)


    def home (self):
        """
        Perform a home (move to (0,0)).
        """
        self.goto (0, 0)


    def cr (self):
        """
        Perform a carriage return (move to column 0).
        """
        self.cursor = (0, self.cursor [1])


    def nl (self):
        """
        Move to a new line (does not move to column 0).
        """
        if self.wrapped:
            self.wrapped = False
            return
        self.wrapped = False
        self.cursor = (0, self.cursor [1] + 1)
        if self.cursor [1] >= self.height:
            self.scroll()


    def where (self):
        """
        Return a tuple (x,y) indicating the (0-based) location of the cursor.
        """
        return self.cursor


    def get (self, x, y):
        """
        Return data at these coordinates.
        """
        char, bg, fg, attr = self.data[y][x]
        if attr & self.INVERSE:
            # Mark INVERSE as handled by removing it from the attr field.
            attr |= ~self.INVERSE
            bg, fg = fg, bg
        return Char (char=char, bg=bg, fg=fg, attr=attr)


    def putc (self, c, fg=None, bg=None, attr=None):
        """
        Add a character at the cursor's position. Move the
        cursor. Scroll if we have to.
        """
        x, y = self.cursor
        try:
            self.data [y][x] = self.c (c, fg=fg, bg=bg, attr=attr)
        except IndexError:
            raise RuntimeError ('Cursor off-screen: %d,%d (%dx%d)' % (x, y, self.width, self.height))

        self.wrapped = False

        # Move the 'carriage'
        self.cursor = (x + 1, y)

        # Implement smart wrap-around.
        if self.cursor[0] >= self.width:
            self.wrapped = True
            self.cursor = (0, y + 1)
            if self.cursor [1] >= self.height:
                self.scroll()


    def clrscr (self):
        """
        Clear the screen using the current attributes.
        """
        c = self.c (32)
        self.data = [ [ c for x in xrange (self.width) ] for y in xrange (self.height) ]


    def clreol (self):
        """
        Clear characters until the end of this line. Don't move the cursor.
        """
        x, y = self.cursor
        empty = [ self.c (32) for i in xrange (self.width - x) ]
        self.data [y] = self.data [y][:x] + empty


# End of file.
