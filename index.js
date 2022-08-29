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

        fetch = (url) => {
            return new Promise((resolve, reject) => {
            https.get(url, (res) => {
                    let data = [];

                    res.on('data', chunk => {
                        data.push(chunk);
                    });

                    res.on('end', () => {
                    resolve(Buffer.concat(data).toString()); 
                    });
                })
            })
        }

        async addButton(elem) {
            if (elem.querySelector(".search-button")) return;

            var discrimElem = document.evaluate(`//span[text()='#']`, elem, null, XPathResult.ANY_TYPE, null).iterateNext();
            var discrim = discrimElem.innerText;
            var name = elem.ariaLabel;
            var name_and_discrim = elem.ariaLabel + discrim;
            var url = "https://archived.moe/_/search/text/" + encodeURIComponent(name_and_discrim);
            const headers = {
                method: "GET",
            }

            const myButton = document.createElement("button");
            myButton.setAttribute("class", "search-button");
            myButton.textContent = "Searching...";
            myButton.style.color = "white";
            myButton.style.backgroundColor = "transparent";
            myButton.style.outlineColor = "black";

            const root = document.querySelector(DiscordSelectors.UserPopout.userPopout);
            root.append(myButton);

            let res = await this.fetch(url, headers);

            if (res.split(new RegExp(name_and_discrim, "i")).length - 1 >= 6) {
                myButton.textContent = "Direct match found!";
            }
            else {
                url = "https://archived.moe/_/search/text/" + encodeURIComponent(name);
                res = await this.fetch(url, headers);

                //console.log(res.split(new RegExp(`${name}#[0-9]{4}`, "i")).length - 1);
                if (res.includes("No results found")) {
                    myButton.textContent = "No results found";
                }
                else if (res.split(new RegExp(`${name}#[0-9]{4}`, "i")).length - 1 > 0) {
                    myButton.textContent = "Results found - nonmatching discriminator";
                }
                else {
                    myButton.textContent = "Results found - no direct match";
                }
            }

            myButton.addEventListener("click", () => {
                var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
                require('child_process').exec(start + ' ' + url);
            });
        }

        observer(e) {
            if (!e.addedNodes.length || !(e.addedNodes[0] instanceof Element)) return;
            if (document.querySelector(DiscordSelectors.UserPopout.userPopout)) { 
                this.addButton(document.querySelector(DiscordSelectors.UserPopout.userPopout));
            }
        }

    };
};