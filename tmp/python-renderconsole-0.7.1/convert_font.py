#!/usr/bin/env python
#
"""
$Id: convert_font.py 16 2008-11-20 15:04:39Z alexios $

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
import textwrap


def convert (infilename, outfilename):
    """
    Convert the font in `filename` to a python module.
    """
    print "converting font %s to %s" % (infilename, outfilename)
    data = open (infilename).read()
    if (len (data) % 256) != 0:
        raise ValueError ('This file is probably not a VGA font (not a multiple of 256).')
    #print repr (data)
    #dir (array)
    x = array.array ('B')
    x.fromstring (data)
    stringData = ''.join ([ '\\x%02x' % ord(x) for x in data ])

    outf = open (outfilename, 'w')
    outf.write ('# -*- python -*-\n')
    outf.write ('#\n# $Id: convert_font.py 16 2008-11-20 15:04:39Z alexios $\n#\n')
    outf.write ('# GENERATED AUTOMATICALLY FROM %s, DO NOT EDIT.\n\n' % infilename)
    outf.write ('"This is the default, built-in VGA font."\n\n')
    outf.write ('data = \'\'.join ([\n')
    for line in textwrap.wrap (stringData, len (data) / 64):
        outf.write ("    '%s',\n" % line)
    outf.write ('])\n\n# End of file\n')
    outf.close()
    

if __name__ == '__main__':
    convert ('fonts/lat8x16.fnt', 'foo.py')


# End of file.
