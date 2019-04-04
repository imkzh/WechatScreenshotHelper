# Release Notes

## r2.0.4
Release 2.0.4 can be found [Here](https://github.com/imkzh/WechatScreenshotHelper/releases/tag/r2.0.4).

### Code:
* created a simple preprocessor to "complile" the extension based on multiple files.

### Bugfixies:
* Removed overlay for main canvas, high images will show correctly now.

## r2.0.3
Release 2.0.3 can be found [Here](https://github.com/imkzh/WechatScreenshotHelper/releases/tag/r2.0.3).

### Bugfixies:
* Resolved confliction between text tool and Undo/Redo, these operations will discard pending text now.
* Added support for Google Chrome, tested under 73.0.3683.86.
* Backend will start correctly now (will check before copying configurations).
* Added request for permissions on `wx.qq.com` in manifest.

## r2.0
This is a milestone! Download this extension at [Release 2.0.2](https://github.com/imkzh/WechatScreenshotHelper/releases/tag/r2.0.2).

### Improvements:
* Added support for "edit, confirm and send".
* Better backend(we are using `gnome-screenshot` now)
* Added screenshot editor!
    * added support for drawing lines.
    * added support for adding rectangles and arrows,
    * added support for adding texts. 
    * added support for changing text size.
* Added support for undo and redo while editing
* Code cleanups.
* Updated the instruction messages for cases when backend is not running correctly.

### Bugfixies:
* Backend now starts with system correctly.
* You can cancel the screenshot procedure now.