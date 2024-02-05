# NOTE
to generate this I followed a mixture of
- https://github.com/gitname/react-gh-pages
- https://create-react-app.dev/docs/deployment/

What was missing was the follwoing:
- I deleted the .git folder that came with the react app and replaced it with a clone from this github repo
- I needed to do a first commit to the normal repo to instantiate it, otherwise it was empty and could not be found

What still was not working is the normal pull push... at least for some time... for some reason the suddently it worked...

Another problem of the process was that when building and deploying the app because of the "eject" call all src files were removed. this means the way to go is to have the frontend 

