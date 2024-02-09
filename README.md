# NOTE
to generate this I followed a mixture of
- https://github.com/gitname/react-gh-pages
- https://create-react-app.dev/docs/deployment/

What was missing was the follwoing:
- I deleted the .git folder that came with the react app and replaced it with a clone from this github repo
- I needed to do a first commit to the normal repo to instantiate it, otherwise it was empty and could not be found

What still was not working is the normal pull push... at least for some time... for some reason the suddently it worked...

Another problem of the process was that when building and deploying the app because of the "eject" call all src files were removed. 
this means the way to go is to have the frontend separated and always clone it newly from the main location
alternaltively the eject command could be removed so that it doesnt deletes the src folder

For the Final Proof of Concept the Flask app is hosted on https://www.pythonanywhere.com and accessed via https://Samuelknobel.pythonanywhere.com/apidocs. Any changes have to be uploaded there as well. 

The final app is hosed on GIT : https://samuelknobel.github.io/LOTRwebEditor.github.io/ <-- to update this the web app has to build and deployed again.

