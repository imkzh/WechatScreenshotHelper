# WechatScreenshotHelper

This repository includes both source code for browser extension: **Wechat Screenshot Capture Helper(Ubuntu)** and the screenshot backend.

# Installation and Configuration

## Step 1. Download and Install the Extension

### For Firefox Users
* Download Firefox addon file(.xpi) here: [Release 2.0.3](https://github.com/imkzh/WechatScreenshotHelper/releases/tag/r2.0.3)
* **Drag-and-drop** the `.xpi` file you downloaded into Firefox.
* Select `Add` when it prompts.

### For Chrome Users
* Download Chrome extension file(.crx) here: [Release 2.0.3](https://github.com/imkzh/WechatScreenshotHelper/releases/tag/r2.0.3)
* Navigate to `chrome://extensions`.
* **drag-and-drop** the `.crx` file you downloaded into Firefox
* Select `Add Extension` when it prompts.

## Step 2. Config the Backend

### Step 2.1 Get the Backend

clone this repository to get the backend:

    git clone https://github.com/imkzh/WechatScreenshotHelper

### Step 2.2 Install It

`install` the WechatScreenshotHelper backend with:

    cd WechatScreenshotHelper
    python3 ./config.py install

> (After installing the backend, it will automatically start with system.)

### Note: 

* you will need both `browser extension` installed and `This Repository` configured for screenshot button to be functional.
* If you moved your installation, please configure it again.
* **Keep** the source after install, because we are actually calling it from a generated script in `~/.config/autostart`
* `gnome-screenshot` is required for screenshot to work.

## Uninstall

To uninstall the backend:

    cd WechatScreenshotHelper
    python3 ./config.py uninstall

> Remember to remove the extension from browser if you are not using this anymore.

## Cares to be Taken:

* Use this tool gracefully, **DO NOT** abuse this, because Tencent(Wechat) **MAY BAN YOUR ACCOUNT WITHOUT ANY WARNING**. I took no responsibility if you got blacklisted.
* the backend is actually using a file at `/tmp/firefox-screenshot.png` and a TCP Socket on port `32728`. The backend server is hand made(by myself) and may not secure enough, but we are listening **only for local connections** and is requiring an special `access_key` for important operations, so it is not that dangerous.
* I have tested it under `Ubuntu16.04` with `Firefox 65.0.1`, but not sure if it works on other linux distro (theoretically it should).

# License
This work is licensed under GPLv3.

All icons and images included are licensed under Creative Commons Attribution-NonCommercial 4.0 International.

![licicons](http://i.creativecommons.org/l/by-nc/4.0/88x31.png "Creative Commons License")

# Privacy
Your privacy is important to us. We will not **collect** or **send** personal data including `your personal information`, `chat log`, `contacts` and `usage detail` without your permission. And currently there are no code to collect your personal data.
