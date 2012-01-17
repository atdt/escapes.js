# -*- python -*-
"""
$Id: font.py 21 2009-02-28 10:07:07Z alexios $

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


import array

from util import debug
import fontdata


class VGAFont (object):
    """
    Represent a VGA text font loaded from a file.

    These small binary files contain 256 characters (though 512-character fonts
    are occasionally encountered in the wild), each represented by a number of
    bytes. Each byte represents one row of the character's appearance. The
    least significant bit represents the rightmost pixel. Most fonts are 8x8
    (CGA, EGA and VGA), 8x14 (EGA and VGA), or 8x16 (VGA), but other sizes up
    to 8x30 may be encountered. Some early SVGAs had 8x11 and 8x12 fonts.

    VGA fonts originally had no encoding information, and we likewise ignore
    this.
    """

    width = 8

    numChars = 256
    
    def __init__ (self, filename):
        self.filename = filename

        # Load the font data.
        debug ("Loading font %s." % filename)
        self.data = open (filename, 'rb').read()
        debug ("Loaded %d bytes." % len (self.data))
        self._process()


    def _process (self):
        """
        Split font data into glyphs.
        """
        # Autodetect the font size.
        size = len (self.data)
        if size % 256:
            raise TypeError ('This is probably not a raw, uncompressed VGA font.')
        
        self.height = size // 256
        debug ("Font is 8x%(height)d." % self.__dict__)

        # Parse each character
        self.chars = dict()
        bindata = array.array ('B')
        bindata.fromstring (self.data)
        for char in xrange (self.numChars):
            self.chars [char] = bindata [char * self.height : (char + 1) * self.height]

        # Cache the bitmap.
        self._bitmap = [ 1 << bit for bit in xrange (self.width - 1, -1, -1) ]


    def render (self, char, space=None, mark=None):
        """
        Render a character and return it as a list of strings.
        """
        if char < 0 or char >= self.numChars:
            raise ValueError ('char must be in the range 0-%d' % self.numChars - 1)

        space = space or '.'
        mark = mark or '#'

        def renderLine (line):
            "Render a single raster."
            return ''.join ([ (line & bit) and mark or space for bit in self._bitmap ])
        
        return map (renderLine, self.chars [char])


class DefaultFont (VGAFont):
    """
    The default font: a standard latin (CP437) 8x16 font.
    """
    def __init__ (self):
        # Use the prepackaged font.
        self.data = fontdata.data
        self._process()


# End of file.

