# Deployment

To deploy to firebase, run:

1. firebase login
2. firebase init

    > set the release folder to `release`

3. firebase deploy

Build, test and deploy to firebase hosting:

1. npm run build
2. cp -r build/* release
3. serve -s release
4. firebase deploy
