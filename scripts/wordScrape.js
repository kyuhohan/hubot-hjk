var jsdom = require('jsdom');

module.exports = function(robot) {

    //helper methods
    capitalizeFirstLetter = function(str) {
        return str[0].toUpperCase() + str.slice(1);
    }

    dateToText = function(date) {
        return "".concat(date.getFullYear(),".",date.getMonth()+1,".",date.getDate());
    }

    scrapeWords = function(msg) {
        var url = 'http://m.wordbook.naver.com/endic/today/words.nhn?targetDate=';
        message = msg.match[0];

        console.log(message);

        t = new Date();
        if(message.match(/(어제|yesterday)/)) {
            t.setDate(t.getDate()-1);
            url+= dateToText(t);
        } else if(message.match(/(그저께|그제)/)) {
            t.setDate(t.getDate()-2);
            url+= dateToText(t);
        }

        if(msg.match.length>2 && msg.match[2].length>0) {
            t = new Date(msg.match[2]);
            url+= dateToText(t);
        }


        jsdom.env(url, function(err, window) {
            var $ = require('jquery')(window);
            console.log(url);

            if(err) {
                console.log(err);
            } else {
                words = [];
                phonetics = []
                meanings = [];

                window.$(".words").each(function() {
                    words.push($(this).text());
                });
                window.$(".phonetic").each(function() {
                    phonetics.push($(this).text());
                })
                window.$(".txt_ct2").each(function() {
                    meanings.push($(this).text());
                });

                results = "";
                for(i=0; i<words.length; i++) {
                    results+= words[i] + " " + phonetics[i] + "\n";
                    if(!msg.match[0].match(/단어만/)) {
                        results+= meanings[i] + "\n";
                    }
                }
            }
            msg.send(results);

        });
    }

    findExample = function(msg) {
        word = msg.match[2].trim();

        if(msg.match.length>3 && parseInt(msg.match[3])) {
            num = msg.match[3];
        } else {
            num = 5;
        }

        url = 'http://endic.naver.com/search_example.nhn?sLn=kr&query='+ encodeURIComponent(word) + '&preQuery=&searchOption=example&forceRedirect=N';
        console.log(url);

        jsdom.env(url, function(err, window) {
            var $ = require('jquery')(window);

            if(err) {
                console.log(err);
            } else {
                sentences = [];
                translations= [];

                window.$(".list_a_mar .mar_top01").each(function() {
                    tmp = "";
                    $(this).find("input").each(function() {
                        tmp+= $(this).prop('value') + " ";
                    });
                    sentences.push(tmp.replace(word, "*"+word+"*").replace(capitalizeFirstLetter(word), "*"+capitalizeFirstLetter(word)+"*"));
                });

                window.$("[class='N=a:xmp.detail']:not(.detail_url_link)").each(function() {
                    translations.push($(this).text());
                });
            }

            results = "";
            for(i=0; i<Math.min(num, sentences.length); i++) {
                results+= sentences[i] + "\n";
                results+= translations[i] + "\n";
            }

            msg.send(results);
        });

    }

    //robot.hear(/test/ig, scrapeWords);
    robot.hear(/(오늘|어제|그제|그저께).*단어.*/i, scrapeWords);
    robot.hear(/단어.*(주세요|나와라)/i, scrapeWords);
    robot.hear(/(today|yesterday).*word.*/i, scrapeWords);
    robot.hear(/(단어|word)\D*([\d-]+)/i, scrapeWords);

    robot.hear(/(예문|example) (\D*)(\d*)/i, findExample);

    robot.hear(/단어봇 사용법/i, function(msg) {
        response ="```\n(오늘|어제|그제|그저께) 단어: 단어 + 뜻\n(오늘|어제|그제|그저께) 단어만: 단어만\n단어 (주세요|나와라): 오늘의 단어\n단어 yyyy-mm-dd: 해당일자의 단어\n단어만 yyyy-mm-dd: 해당일자의 단어만\n\n(예문|example) 단어 (optional)N: 단어 예문 (N개. default 5개)\n```";
        msg.reply(response);
    })
}

//#TODO
//example AB test
//example AB
//example jw
//example SlacK test
//example CEO
//example fablous
