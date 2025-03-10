@echo off
start "" /B cmd /C "npm i && set NODE_ENV=development && npm run start"
echo        "____     __     ______    ___    _____    ______        _       __    ___     ____  ______"
echo       "/ __ \   / /    / ____/   /   |  / ___/   / ____/       | |     / /   /   |   /  _/ /_  __/"
echo      "/ /_/ /  / /    / __/     / /| |  \__ \   / __/          | | /| / /   / /| |   / /    / /"
echo     "/ ____/  / /___ / /___    / ___ | ___/ /  / /___          | |/ |/ /   / ___ | _/ /    / /     _  _  _ "
echo    "/_/      /_____//_____/   /_/  |_|/____/  /_____/          |__/|__/   /_/  |_|/___/   /_/     (_)(_)(_)" 
echo " "
echo "When open the browser and wait for it to load for a moment (no more than 10 seconds)."

timeout /t 3 >nul
start http://localhost:3000
