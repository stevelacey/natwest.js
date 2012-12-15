#!/usr/bin/node

var $ = require('jquery'),
    account = require('./account.json'),
    moment = require('moment')
;

var natwest = (function() {
    var nwolb = 'https://www.nwolb.com';

    var request = require('request').defaults({
        headers: {
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/5XX.XX (KHTML, like Gecko) Chrome'
        },
        followAllRedirects: true
    });

    var parse = function(arguments) {
        var arguments = Array.prototype.slice.call(arguments);

        if (typeof(arguments[0]) !== 'object') {
            arguments.unshift({});
        }

        if (arguments[0].uri === undefined) {
            arguments[0].uri = nwolb;
        } else {
            if (arguments[0].uri.indexOf(nwolb) === -1) {
                arguments[0].uri = nwolb + '/' + arguments[0].uri
            }
        }

        return arguments;
    }

    return {
        get: function() {
            return request.get.apply(this, parse(arguments));
        },
        post: function() {
            return request.post.apply(this, parse(arguments));
        }
    }
})();

var nwolb = {
    login: function (error, r, login) {
        if (!error && r.statusCode == 200) {
            natwest.get(
                {
                  uri: $('frame', login).first().attr('src'),
                },
                nwolb.enter_customer_details
            );
        }
    },

    enter_customer_details: function (error, r, enter_customer_number) {
        if (!error && r.statusCode == 200) {
            var form = $('form:first', enter_customer_number);

            natwest.post(
                {
                    uri: form.attr('action'),
                    form: form
                        .find('input:text')
                            .val(account.customer_number)
                            .end()
                        .serializeJSON()
                },
                nwolb.enter_pin_and_password
            );
        }
    },

    enter_pin_and_password: function (error, r, enter_pin_and_password) {
        if (!error && r.statusCode == 200) {
            var form = $('form:first', enter_pin_and_password);

            form.each(function() {
                var a2f = 'ABCDEF'.split('');

                for (var i = 0; i < a2f.length; i++) {
                    var input = $('input[name="ctl00$mainContent$Tab1$LI6PPE' + a2f[i] + '_edit"]', form);
                    var label = $('label[for="' + input.attr('id') + '"]', form);

                    var digit = label.text().replace(/[^\d]/g, '') - 1;

                    if (i < a2f.length / 2) {
                        input.val(account.pin[digit]);
                    } else {
                        input.val(account.password[digit]);
                    }
                }
            });

            natwest.post(
                {
                    uri: form.attr('action'),
                    form: form.serializeJSON()
                },
                nwolb.account_summary
            );
        }
    },

    account_summary: function (error, r, account_summary) {
        if (!error && r.statusCode == 200) {
            natwest.get(
                {
                    uri: $('a:contains("View full statement")', account_summary).attr('href')
                },
                nwolb.statements
            );
        }
    },

    statements: function (error, r, statements) {
        if (!error && r.statusCode == 200) {
            var form = $('form:first', statements);

            form.each(function() {
                $('select:first option:first', form).prop('selected', true);
                $('select:last option:last', form).prop('selected', true);
            });

            natwest.post(
                {
                    uri: form.attr('action'),
                    form: form.serializeJSON()
                },
                nwolb.statements2
            );
        }
    },

    statements2: function (error, r, statements) {
        if (!error && r.statusCode == 200) {
            var form = $('form:first', statements);

            var to = moment(new Date);
            var from = moment(new Date).subtract('days', 365);

            $('input:text', form)
                .first()
                    .val(from.format('D'))
                        .siblings('select')
                            .first()
                                .find('option').removeAttr('selected')
                                    .filter('[value="' + from.format('M') + '"]')
                                        .attr('selected', 'selected')
                                    .end()
                                .end()
                            .end()
                            .last()
                                .find('option').removeAttr('selected')
                                    .filter('[value="' + from.format('YYYY') + '"]')
                                        .attr('selected', 'selected')
                                    .end()
                                .end()
                            .end()
                        .end()
                    .end()
                .last()
                    .val(to.format('D'))
                        .siblings('select')
                            .first()
                                .find('option').removeAttr('selected')
                                    .filter('[value="' + to.format('M') + '"]')
                                        .attr('selected', 'selected')
                                    .end()
                                .end()
                            .end()
                            .last()
                                .find('option').removeAttr('selected')
                                    .filter('[value="' + to.format('YYYY') + '"]')
                                        .attr('selected', 'selected')
                                    .end()
                                .end()
                            .end()
                        .end()
                    .end()
                .end()
            ;

            var data = form.serializeJSON();

            data.ctl00$mainContent$NextButton_button = 'View Transactions';

            natwest.post(
                {
                    uri: form.attr('action'),
                    form: data
                },
                nwolb.statement
            );
        }
    },

    statement: function (error, r, statement) {
        if (!error && r.statusCode == 200) {
            natwest.get(
                {
                    uri: $('table thead th a:contains("All")', statement).attr('href')
                },
                nwolb.full_statement
            )
        }
    },

    full_statement: function (error, r, html) {
        if (!error && r.statusCode == 200) {
            var statement = $('table tbody tr', html)
                .map(function() {
                    var c =  $('td', this);

                    return {
                        description: c.eq(2).text().replace(new RegExp(' ,', 'g'), ','),
                        date: moment(c.eq(0).text()).format('YYYY-M-D'),
                        type: c.eq(1).text(),
                        amount: Number(c.eq(3).text().replace(/[^0-9\.]/g, '') - c.eq(4).text().replace(/[^0-9\.]/g, '')).toFixed(2),
                        balance: Number(c.eq(5).text().replace(/[^0-9\.-]/g, '')).toFixed(2)
                    }
                })
                .get()
            ;

            console.log(JSON.stringify(statement));
        }
    }
}

natwest.get(nwolb.login);

$.fn.serializeJSON = function() {
    var json = {};

    $.map($(this).serializeArray(), function(n, i) {
        json[n['name']] = n['value'];
    });

    return json;
};