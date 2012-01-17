# -*- python -*-
"""
$Id: __init__.py 20 2009-02-19 09:08:18Z alexios $

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

from renderconsole.font import VGAFont, DefaultFont
from renderconsole.framebuffer import Framebuffer
from renderconsole.terminal import TerminalEmulator, ANSITerminalEmulator
from renderconsole.screen import Screen, LinuxTTY, XPMWriter, PNGWriter, GIFWriter
from renderconsole.util import debugEnabled, debug


__package_version__ = '@Version: 0.7.1 @'.split()[-2:][0] or '0'


__version__ = __package_version__ + '.' + ("$Rev: 20 $".split()[-2:][0] or '0')


__all__ = [
    'font',
    'framebuffer',
    'terminal',
    'screen',
    ]


# End of file.
