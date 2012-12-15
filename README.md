# NatWest.js

## Overview

This is a rudimentary API for [NatWest Online banking](https://www.nwolb.com), based loosely on the Ruby script by @runpaint.

At the moment it consists of a command-line application that simply dumps out your last year of account transactions.

## Usage

- Install dependencies via NPM
- Create an account.json based on the example provided. **Warning**: should be `chmod 600`.
- Run natwest.js

## Purpose

The login procedure for [nwolb](https://www.nwolb.com) is pure security theatre. It requires:

- Spoofing your user agent, using Chrome in this case.
- Entering your customer number, then clicking "Log in".
- Determining three specific digits of your PIN, then entering them in individual form fields.
- Determining three specific characters of your password, then entering them in individual form fields.
- Hitting "Next".

(For extra difficulty, the last "Next" button is positioned under a series of
three images: if you click on it before the images have loaded, you're likely
to click one of those instead, which loads an unrelated page).

Retrieving statements requires the following:

- Traversing to the statements search.
- Adjusting the date fields (to no more than a 365 day range).
- Punching it.
- Clicking the "All" link in the pagination to retrieve all results.
- Parsing the table output.

## Bugs

This utility relies on screen-scraping multiple pages of horrendous HTML. Further, it has only been tested with one account. Feel free to report errors, preferably with the HTML, appropriately sanitised, on which it fails.