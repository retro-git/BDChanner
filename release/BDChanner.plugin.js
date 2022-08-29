/**
 * @name BDChanner
 * @description Auto-search for users on archived.moe by clicking user profile
 * @version 0.1.0
 * @author boosh
 * @website https://github.com/retro-git/BDChanner
 * @source https://github.com/retro-git/BDChanner/blob/master/release/BDChanner.plugin.js
 */
/*@cc_on
@if (@_jscript)
    
    // Offer to self-install for clueless users that try to run this directly.
    var shell = WScript.CreateObject("WScript.Shell");
    var fs = new ActiveXObject("Scripting.FileSystemObject");
    var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\\BetterDiscord\\plugins");
    var pathSelf = WScript.ScriptFullName;
    // Put the user at ease by addressing them in the first person
    shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
    if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
        shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
    } else if (!fs.FolderExists(pathPlugins)) {
        shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
    } else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
        fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
        // Show the user where to put plugins in the future
        shell.Exec("explorer " + pathPlugins);
        shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
    }
    WScript.Quit();

@else@*/
const config = {"info":{"name":"BDChanner","authors":[{"name":"boosh","github_username":"retro-git"}],"version":"0.1.0","description":"Auto-search for users on archived.moe by clicking user profile","github":"https://github.com/retro-git/BDChanner","github_raw":"https://github.com/retro-git/BDChanner/blob/master/release/BDChanner.plugin.js"},"main":"index.js"};
class Dummy {
    constructor() {this._config = config;}
    start() {}
    stop() {}
}
 
if (!global.ZeresPluginLibrary) {
    BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
        confirmText: "Download Now",
        cancelText: "Cancel",
        onConfirm: () => {
            require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                if (error) return require("electron").shell.openExternal("https://betterdiscord.app/Download?id=9");
                await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
            });
        }
    });
}
 
module.exports = !global.ZeresPluginLibrary ? Dummy : (([Plugin, Api]) => {
     const plugin = (Plugin, Api) => {
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

            if (res.split(name_and_discrim).length - 1 >= 6) {
                myButton.textContent = "Direct match found!";
            }
            else {
                url = "https://archived.moe/_/search/text/" + encodeURIComponent(name);
                res = await this.fetch(url, headers);
                if (res.includes("No results found")) {
                    myButton.textContent = "No results found";
                }
                else if (res.split(name).length - 1 >= 6) {
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
     return plugin(Plugin, Api);
})(global.ZeresPluginLibrary.buildPlugin(config));
/*@end@*/