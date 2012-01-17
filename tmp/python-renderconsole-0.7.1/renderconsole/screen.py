# -*- python -*-
"""
$Id: screen.py 14 2008-11-20 13:47:34Z alexios $

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

import sys
try:
    import cStringIO as StringIO
except ImportError:
    import StringIO

import PIL.Image

from framebuffer import Framebuffer


class Screen (object):
    """
    Simulate a rendering device of some sort.
    """
    def __init__ (self, framebuffer, stream=None):
        self.framebuffer = framebuffer
        self.stream = stream or sys.stdout


    def render (self):
        """
        Render a framebuffer on this screen.
        """
        self.renderStart()
        for y in xrange (self.framebuffer.height):
            self.renderStartLine (y)
            for x in xrange (self.framebuffer.width):
                data = self.framebuffer.get(x, y)
                self.renderChar (x, y, data.char, data.fg, data.bg, data.attr)
            self.renderEndLine (y)
        self.renderEnd()


    def renders (self):
        """
        Render a framebuffer on this screen. Return the output in a string.
        """
        stream = self.stream
        retval = StringIO.StringIO()
        self.stream = retval
        self.render()
        self.stream = stream
        return retval.getvalue()


    def renderStart (self):
        """
        Start rendering the frame.
        """
        pass


    def renderStartLine (self, y):
        """
        Start rendering a line of characters.
        """
        pass


    def renderChar (self, x, y, char, fg, bg, attr):
        """
        Render a single character.
        """
        raise NotImplemented ('Abstract method')


    def renderEndLine (self, y):
        """
        End rendering a line of characters.
        """
        pass


    def renderEnd (self):
        """
        End rendering the frame.
        """
        pass


class LinuxTTY (Screen):
    """
    Render the contents of a framebuffer onto a Linux terminal.
    """
    FOREGROUNDS = {
        Framebuffer.BLACK: '30',
        Framebuffer.RED: '31',
        Framebuffer.GREEN: '32',
        Framebuffer.BROWN: '33',
        Framebuffer.BLUE: '34',
        Framebuffer.MAGENTA: '35',
        Framebuffer.CYAN: '36',
        Framebuffer.GREY: '37',
        Framebuffer.DARK_GREY: '1;30', # Not quite supported.
        Framebuffer.LIGHT_RED: '1;31',
        Framebuffer.LIGHT_GREEN: '1;32',
        Framebuffer.YELLOW: '1;33',
        Framebuffer.LIGHT_BLUE: '1;34',
        Framebuffer.LIGHT_MAGENTA: '1;35',
        Framebuffer.LIGHT_CYAN: '1;36',
        Framebuffer.WHITE: '1;37',
        }

    BACKGROUNDS = {
        Framebuffer.BLACK: '40',
        Framebuffer.RED: '41',
        Framebuffer.GREEN: '42',
        Framebuffer.BROWN: '43',
        Framebuffer.BLUE: '44',
        Framebuffer.MAGENTA: '45',
        Framebuffer.CYAN: '46',
        Framebuffer.GREY: '47',
        Framebuffer.DARK_GREY: '', # Not quite supported.
        Framebuffer.LIGHT_RED: '101',
        Framebuffer.LIGHT_GREEN: '102',
        Framebuffer.YELLOW: '103',
        Framebuffer.LIGHT_BLUE: '104',
        Framebuffer.LIGHT_MAGENTA: '105',
        Framebuffer.LIGHT_CYAN: '106',
        Framebuffer.WHITE: '107',
        }


    def __init__ (self, framebuffer, encoding=None, **kwargs):
        self.encoding = encoding
        Screen.__init__ (self, framebuffer, **kwargs)


    def renderChar (self, x, y, char, fg, bg, attr):
        """
        Render a single character.
        """
        ansi = filter (None, ['0', self.FOREGROUNDS.get(fg), self.BACKGROUNDS.get(bg), ])
        ansi = ';'.join (ansi)
        
        
        if char < 32 or char == 127:
            c = '?'
        else:
            try:
                c = chr (char).decode(self.encoding).encode('utf-8')
            except UnicodeError:
                c = '?'

        self.stream.write ('\033[%sm%s' % (ansi, c))


    def renderStart (self):
        """
        Start rendering. Print a frame around the render area.
        """
        self.stream.write ('+%s+\n' % ('-' * self.framebuffer.width))


    def renderStartLine (self, y):
        """
        Start rendering a line.
        """
        self.stream.write ('|')


    def renderEndLine (self, y):
        """
        Render the end of a line.
        """
        self.stream.write ('\033[0m|\n')


    def renderEnd (self):
        """
        Complete the rendering. Finish the frame.
        """
        self.stream.write ('+%s+\n' % ('-' * self.framebuffer.width))


class XPMWriter (Screen):
    """
    Render the contents of a framebuffer as an XMP.
    """

    EXTENSION = '.xpm'

    COLOURS = [
        '#000000',              # black
        '#0000aa',              # blue
        '#00aa00',              # green
        '#00aaaa',              # cyan
        '#aa0000',              # red
        '#aa00aa',              # magenta
        '#aa5500',              # brown
        '#aaaaaa',              # dark grey
        '#555555',              # light grey
        '#5555ff',              # bright blue
        '#55ff5d',              # bright green
        '#55ffff',              # bright cyan
        '#ff5555',              # bright red
        '#ff55ff',              # bright magenta
        '#ffff55',              # yellow
        '#ffffff',              # white
        ]


    def __init__ (self, framebuffer, font, encoding=None, **kwargs):
        self.encoding = encoding
        self.font = font
        self.row = list()
        Screen.__init__ (self, framebuffer, **kwargs)


    def renderChar (self, x, y, char, fg, bg, attr):
        """
        Render a character as pixmap data. Add each raster line of the glyph's
        data to our raster buffer.
        """
        # Select the colours
        mark = '%x' % fg
        space = '%x' % bg

        # Render the required glyph.
        glyph = self.font.render (char, mark=mark, space=space)
        self.row = [ a + b for a, b in zip (self.row, glyph) ]


    def renderStart (self):
        """
        Start rendering a pixmap. Print out the header.
        """
        w = self.font.width * self.framebuffer.width
        h = self.font.height * self.framebuffer.height
         
        self.stream.write ('/* XPM */\n')
        self.stream.write ('static char *ansi[] = {\n')
        self.stream.write ('/* width height ncolors cpp [x_hot y_hot] */\n')
        self.stream.write ('"%(w)s %(h)s 16 1 0 0",\n' % locals())

        # Output the palette.
        for i, colour in enumerate (self.COLOURS):
            self.stream.write ('"%x c %s",\n' % (i, colour))
        self.stream.write ('/* pixels */\n')


    def renderStartLine (self, y):
        """
        Start a new text mode line. Clear the raster buffer.
        """
        self.row = [ '' for x in xrange (self.font.height) ]


    def renderEndLine (self, y):
        """
        At the end of each text mode line, dump all the raster rows we have. Be
        sure to terminate properly.
        """
        if y > 0:
            self.stream.write (',\n')
        self.stream.write (',\n'.join ([ '"%s"' % raster for raster in self.row ]))


    def renderEnd (self):
        """
        End the XPM output.
        """
        self.stream.write ('\n};\n')


class PNGWriter (XPMWriter):
    """
    Generate a PNG out of an XPM image.
    """

    EXTENSION = '.png'

    def __init__ (self, *args, **kwargs):
        XPMWriter.__init__ (self, *args, **kwargs)
        self.outStream = self.stream
        self.stream = StringIO.StringIO()


    def render (self):
        """
        Render into a pipeline that converts from an XMP to a PNG.
        """
        XPMWriter.render (self)
        self.stream.seek (0, 0)
        image = PIL.Image.open (self.stream)
        image.save (self.outStream, 'PNG')
    
    
class GIFWriter (XPMWriter):
    """
    Generate a GIF out of an XPM image.
    """

    EXTENSION = '.gif'

    def __init__ (self, *args, **kwargs):
        XPMWriter.__init__ (self, *args, **kwargs)
        self.outStream = self.stream
        self.stream = StringIO.StringIO()


    def render (self):
        """
        Render into a pipeline that converts from an XMP to a GIF.
        """
        XPMWriter.render (self)
        self.stream.seek (0, 0)
        image = PIL.Image.open (self.stream)
        image.save (self.outStream, 'GIF')
    
    
# End of file.
