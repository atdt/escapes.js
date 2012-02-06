all: 	minify
minify:
	uglifyjs --unsafe -o escapes.min.js escapes.js
