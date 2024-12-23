rm -rf release
mkdir release
npm run build
cp -r build/* release
firebase deploy --only hosting
