@echo off
start "" /B cmd /C "npm run start"
echo        "____     __     ______    ___    _____    ______        _       __    ___     ____  ______"
echo       "/ __ \   / /    / ____/   /   |  / ___/   / ____/       | |     / /   /   |   /  _/ /_  __/"
echo      "/ /_/ /  / /    / __/     / /| |  \__ \   / __/          | | /| / /   / /| |   / /    / /"
echo     "/ ____/  / /___ / /___    / ___ | ___/ /  / /___          | |/ |/ /   / ___ | _/ /    / /     _  _  _ "
echo    "/_/      /_____//_____/   /_/  |_|/____/  /_____/          |__/|__/   /_/  |_|/___/   /_/     (_)(_)(_)"

timeout /t 3 >nul
start http://localhost:3000
