module.exports = (Plugin, Api) => {
    const https = require('https');
    const {DiscordSelectors, PluginUtilities, DOMTools} = Api;
    return class SendButton extends Plugin {
        onStart() {
            console.log("startup");
            if (document.querySelector(DiscordSelectors.UserPopout.userPopout)) this.addButton(document.querySelector(DiscordSelectors.UserPopout.userPopout));
        }
        
        onStop() {
            const button = document.querySelector(".search-button");
            if (button) button.remove();
        }

        addButton(elem) {
            if (elem.querySelector(".search-button")) return;

            var discrimElem = document.evaluate(`//span[text()='#']`, elem, null, XPathResult.ANY_TYPE, null).iterateNext();
            var discrim = discrimElem.innerText;
            var name = elem.ariaLabel + discrim;
            var url = "https://archived.moe/_/search/text/" + encodeURIComponent(name);

            const myButton = document.createElement("button");
            myButton.setAttribute("class", "search-button");
            myButton.textContent = "Searching...";
            myButton.style.color = "white";
            myButton.style.backgroundColor = "transparent";
            myButton.style.outlineColor = "black";
            myButton.addEventListener("click", () => {
                var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
                require('child_process').exec(start + ' ' + url);
            });

            https.get(url, res => {
              let data = [];
              const headerDate = res.headers && res.headers.date ? res.headers.date : 'no response date';
              console.log('Status Code:', res.statusCode);
              console.log('Date in Response header:', headerDate);
            
              res.on('data', chunk => {
                data.push(chunk);
              });
            
              res.on('end', () => {
                console.log('Response ended: ');
                //console.log(Buffer.concat(data).toString());
                let data_string = Buffer.concat(data).toString();
                if (data_string.includes("No results found")) {
                    myButton.textContent = "No results found";
                }
                else if (data_string.split(name).length - 1 < 6){ 
                    myButton.textContent = "No direct match";
                }
                else {
                    myButton.textContent = "Results found!";
                }
              });
            }).on('error', err => {
              console.log('Error: ', err.message);
            });

            const root = document.querySelector(DiscordSelectors.UserPopout.userPopout);
            root.append(myButton);
            //discrimElem.append(myButton);
            //discrimElem.parentNode.insertBefore(myButton, discrimElem);
        }

        observer(e) {
            if (!e.addedNodes.length || !(e.addedNodes[0] instanceof Element)) return;
            // if (e.addedNodes[0].querySelector(DiscordSelectors.Textarea.inner)) {
            //     this.addButton(e.addedNodes[0]);
            // }
            //console.log(document.querySelector(DiscordSelectors.UserPopout.userPopout));
            if (document.querySelector(DiscordSelectors.UserPopout.userPopout)) { 
                this.addButton(document.querySelector(DiscordSelectors.UserPopout.userPopout));
            }
        }

    };
};