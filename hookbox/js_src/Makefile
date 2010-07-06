all:
	jsio_compile hookbox.pkg -j jsio -o ../static/hookbox.js -d
	jsio_compile hookbox.pkg -j jsio -o ../static/hookbox.min.js -g
	cp ../static/hookbox.min.js ../static/hookbox.min.js.bak
	rm ../static/hookbox.min.js.gz
	gzip ../static/hookbox.min.js
	mv ../static/hookbox.min.js.bak ../static/hookbox.min.js
clean:
	rm ../static/*.js
	rm ../static/*.js.gz
