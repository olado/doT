BIN     := node_modules/.bin
UGLIFY  := $(BIN)/uglifyjs
COFFEE  := $(BIN)/coffee

TARGETS := doT.js compile.js express.js
UGLIFIED:= doT.min.js

all: uglify

uglify: compile $(UGLIFIED)

compile: $(TARGETS)

%.js: src/%.coffee
	$(COFFEE) -co ./ "$<"

%.min.js: %.js
	$(UGLIFY) -o "$@" "$<"

clean:
	rm -f $(TARGETS) $(UGLIFIED)

test: compile
	npm test
