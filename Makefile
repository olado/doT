BIN     := node_modules/.bin
UGLIFY  := $(BIN)/uglifyjs
COFFEE  := $(BIN)/coffee
MOCHA   := $(BIN)/mocha

TARGETS := doT.js dot-compile.js dot-express.js

all: uglify

uglify: compile
	$(UGLIFY) -o doT.min.js doT.js

compile: $(TARGETS)

%.js: src/%.coffee
	$(COFFEE) -co ./ "$<"

clean:
	rm -f $(TARGETS) *.min.js

test: compile
	$(MOCHA)
