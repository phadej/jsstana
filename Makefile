all : test

.PHONY : all test eslint mocha istanbul ljs david README.md dist

BINDIR=node_modules/.bin

MOCHA=$(BINDIR)/_mocha
NYC=$(BINDIR)/nyc
ESLINT=$(BINDIR)/eslint
DAVID=$(BINDIR)/david
LJS=$(BINDIR)/ljs

SRC=lib bin test

test : eslint mocha istanbul david

eslint :
	$(ESLINT) --rulesdir eslint-rules $(SRC)

mocha :
	$(MOCHA) --reporter=spec test

istanbul :
	$(NYC) $(MOCHA) test
	$(NYC) check-coverage --statements 100 --branches 100 --functions 100 --lines 100

ljs : README.md

README.md :
	$(LJS) --no-code -o README.md lib/jsstana.js

david :
	$(DAVID)

dist : test ljs
	git clean -fdx -e node_modules
