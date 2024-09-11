/* ------------
   Shell.ts

   The OS Shell - The "command line interface" (CLI) for the console.

    Note: While fun and learning are the primary goals of all enrichment center activities,
          serious injuries may occur when trying to write your own Operating System.
   ------------ */

// TODO: Write a base class / prototype for system services and let Shell inherit from it.

module TSOS {
    export class Shell {
        // Properties
        public promptStr = ">";
        public commandList = [];
        public curses = "[fuvg],[cvff],[shpx],[phag],[pbpxfhpxre],[zbgureshpxre],[gvgf]";
        public apologies = "[sorry]";

        constructor() {
        }

        public init() {
            var sc: ShellCommand;
            //
            // Load the command list.

            // ver
            sc = new ShellCommand(this.shellVer,
                                  "ver",
                                  "- Displays the current version data.");
            this.commandList[this.commandList.length] = sc;

            // help
            sc = new ShellCommand(this.shellHelp,
                                  "help",
                                  "- This is the help command. Seek help.");
            this.commandList[this.commandList.length] = sc;

            // shutdown
            sc = new ShellCommand(this.shellShutdown,
                                  "shutdown",
                                  "- Shuts down the virtual OS but leaves the underlying host / hardware simulation running.");
            this.commandList[this.commandList.length] = sc;

            // cls
            sc = new ShellCommand(this.shellCls,
                                  "cls",
                                  "- Clears the screen and resets the cursor position.");
            this.commandList[this.commandList.length] = sc;

            // man <topic>
            sc = new ShellCommand(this.shellMan,
                                  "man",
                                  "<topic> - Displays the MANual page for <topic>.");
            this.commandList[this.commandList.length] = sc;

            // trace <on | off>
            sc = new ShellCommand(this.shellTrace,
                                  "trace",
                                  "<on | off> - Turns the OS trace on or off.");
            this.commandList[this.commandList.length] = sc;

            // rot13 <string>
            sc = new ShellCommand(this.shellRot13,
                                  "rot13",
                                  "<string> - Does rot13 obfuscation on <string>.");
            this.commandList[this.commandList.length] = sc;

            // prompt <string>
            sc = new ShellCommand(this.shellPrompt,
                                  "prompt",
                                  "<string> - Sets the prompt.");
            this.commandList[this.commandList.length] = sc;

            // date and time
            sc = new ShellCommand(this.shellDate,
                                  "date",
                                  "<string> - Displays the current date and time.");
            this.commandList[this.commandList.length] = sc;

            // location (assuming you don't actually want us to implement like an api to get a user's actual location)
            sc = new ShellCommand(this.shellLocation,
                                  "location",
                                  "Displays a user's current location (made up");
            this.commandList[this.commandList.length] = sc;

            // fun facts
            sc = new ShellCommand(this.shellFact,
                                  "fact",
                                  "Gives the user a fun fact");
            this.commandList[this.commandList.length] = sc;

            // status message
            sc = new ShellCommand(this.shellStatus, 
                                  "status", 
                                  "<string> - Updates the current status");
            this.commandList[this.commandList.length] = sc;

            // load (check if user input is valid assembly)
            sc = new ShellCommand(this.shellLoad,
                                  "load",
                                  "Validates the usercode in the HTML5 text area");
            this.commandList[this.commandList.length] = sc;

            // bsod
            sc = new ShellCommand(this.shellbsod, 
                                  "bsod", 
                                  "Call at your own risk");
            this.commandList[this.commandList.length] = sc;

            // ps  - list the running processes and their IDs
            // kill <id> - kills the specified process id.

            // Display the initial prompt.
            this.putPrompt();
        }

        public putPrompt() {
            _StdOut.putText(this.promptStr);
        }

        public handleInput(buffer) {
            _Kernel.krnTrace("Shell Command~" + buffer);
            //
            // Parse the input...
            //
            var userCommand = this.parseInput(buffer);
            // ... and assign the command and args to local variables.
            var cmd = userCommand.command;
            var args = userCommand.args;
            //
            // Determine the command and execute it.
            //
            // TypeScript/JavaScript may not support associative arrays in all browsers so we have to iterate over the
            // command list in attempt to find a match. 
            // TODO: Is there a better way? Probably. Someone work it out and tell me in class.
            var index: number = 0;
            var found: boolean = false;
            var fn = undefined;
            while (!found && index < this.commandList.length) {
                if (this.commandList[index].command === cmd) {
                    found = true;
                    fn = this.commandList[index].func;
                } else {
                    ++index;
                }
            }
            if (found) {
                this.execute(fn, args);  // Note that args is always supplied, though it might be empty.
            } else {
                // It's not found, so check for curses and apologies before declaring the command invalid.
                if (this.curses.indexOf("[" + Utils.rot13(cmd) + "]") >= 0) {     // Check for curses.
                    this.execute(this.shellCurse);
                } else if (this.apologies.indexOf("[" + cmd + "]") >= 0) {        // Check for apologies.
                    this.execute(this.shellApology);
                } else { // It's just a bad command. {
                    this.execute(this.shellInvalidCommand);
                }
            }
        }

        // Note: args is an optional parameter, ergo the ? which allows TypeScript to understand that.
        public execute(fn, args?) {
            // We just got a command, so advance the line...
            _StdOut.advanceLine();
            // ... call the command function passing in the args with some über-cool functional programming ...
            fn(args);
            // Check to see if we need to advance the line again
            if (_StdOut.currentXPosition > 0) {
                _StdOut.advanceLine();
            }
            // ... and finally write the prompt again.
            this.putPrompt();
        }

        public parseInput(buffer: string): UserCommand {
            var retVal = new UserCommand();

            // 1. Remove leading and trailing spaces.
            buffer = Utils.trim(buffer);

            // 2. Lower-case it.
            buffer = buffer.toLowerCase();

            // 3. Separate on spaces so we can determine the command and command-line args, if any.
            var tempList = buffer.split(" ");

            // 4. Take the first (zeroth) element and use that as the command.
            var cmd = tempList.shift();  // Yes, you can do that to an array in JavaScript. See the Queue class.
            // 4.1 Remove any left-over spaces.
            cmd = Utils.trim(cmd);
            // 4.2 Record it in the return value.
            retVal.command = cmd;

            // 5. Now create the args array from what's left.
            for (var i in tempList) {
                var arg = Utils.trim(tempList[i]);
                if (arg != "") {
                    retVal.args[retVal.args.length] = tempList[i];
                }
            }
            return retVal;
        }

        //
        // Shell Command Functions. Kinda not part of Shell() class exactly, but
        // called from here, so kept here to avoid violating the law of least astonishment.
        //
        public shellInvalidCommand() {
            _StdOut.putText("Invalid Command. ");
            if (_SarcasticMode) {
                _StdOut.putText("Unbelievable. You, [subject name here],");
                _StdOut.advanceLine();
                _StdOut.putText("must be the pride of [subject hometown here].");
            } else {
                _StdOut.putText("Type 'help' for, well... help.");
            }
        }

        public shellCurse() {
            _StdOut.putText("Oh, so that's how it's going to be, eh? Fine.");
            _StdOut.advanceLine();
            _StdOut.putText("Bitch.");
            _SarcasticMode = true;
        }

        public shellApology() {
           if (_SarcasticMode) {
              _StdOut.putText("I think we can put our differences behind us.");
              _StdOut.advanceLine();
              _StdOut.putText("For science . . . You monster.");
              _SarcasticMode = false;
           } else {
              _StdOut.putText("For what?");
           }
        }

        // Although args is unused in some of these functions, it is always provided in the 
        // actual parameter list when this function is called, so I feel like we need it.

        public shellVer(args: string[]) {
            _StdOut.putText("TypeScript" + " version " + "5.5");
        }

        public shellHelp(args: string[]) {
            _StdOut.putText("Commands:");
            for (var i in _OsShell.commandList) {
                _StdOut.advanceLine();
                _StdOut.putText("  " + _OsShell.commandList[i].command + " " + _OsShell.commandList[i].description);
            }
        }

        public shellShutdown(args: string[]) {
             _StdOut.putText("Shutting down...");
             // Call Kernel shutdown routine.
            _Kernel.krnShutdown();
            // TODO: Stop the final prompt from being displayed. If possible. Not a high priority. (Damn OCD!)
        }

        public shellCls(args: string[]) {         
            _StdOut.clearScreen();     
            _StdOut.resetXY();
        }

        public shellMan(args: string[]) {
            if (args.length > 0) {
                var topic = args[0];
                switch (topic) {
                    case "help":
                        _StdOut.putText("Help displays a list of (hopefully) valid commands.");
                        break;
                    // TODO: Make descriptive MANual page entries for the the rest of the shell commands here.
                    case "ver":
                        _StdOut.putText("Ver displays the current version of the OS.");
                        break;
                    case "shutdown":
                        _StdOut.putText("Shutdown turns off the OS, but leaves the underlying hardware simulation running.");
                        break;
                    case "cls":
                        _StdOut.putText("Cls clears the screen and resets the cursor position.");
                        break;
                    case "man":
                        _StdOut.putText("Man displays the manual page for the specified command.");
                        break;
                    case "trace":
                        _StdOut.putText("Trace enables or disables OS tracing, which helps with debugging.");
                        break;
                    case "rot13":
                        _StdOut.putText("Rot13 obfuscatesa given string by applying the ROT13 algorithm.");
                        break;
                    case "promt":
                        _StdOut.putText("Promt changes the command line promt to the specified string.");
                        break;
                    case "date":
                        _StdOut.putText("Date displays the current date and time.");
                        break;
                    case "location":
                        _StdOut.putText("Location gives you your current location (made up)");
                        break;
                    case "fact":
                        _StdOut.putText("Fact gives you one out of three listed fun facts.");
                        break;
                    case "status":
                        _StdOut.putText("Status updates the current status of the OS");
                        break;
                    case "load":
                        _StdOut.putText("Validates the user code in the HTML5 text area. Only hex digits and spaces are valid");
                        break;
                    case "bsod":
                        _StdOut.putText("tests the screen of death");
                        break;
                    default:
                        _StdOut.putText("No manual entry for " + args[0] + ".");
                }
            } else {
                _StdOut.putText("Usage: man <topic>  Please supply a topic.");
            }
        }

        public shellTrace(args: string[]) {
            if (args.length > 0) {
                var setting = args[0];
                switch (setting) {
                    case "on":
                        if (_Trace && _SarcasticMode) {
                            _StdOut.putText("Trace is already on, doofus.");
                        } else {
                            _Trace = true;
                            _StdOut.putText("Trace ON");
                        }
                        break;
                    case "off":
                        _Trace = false;
                        _StdOut.putText("Trace OFF");
                        break;
                    default:
                        _StdOut.putText("Invalid arguement.  Usage: trace <on | off>.");
                }
            } else {
                _StdOut.putText("Usage: trace <on | off>");
            }
        }

        public shellRot13(args: string[]) {
            if (args.length > 0) {
                // Requires Utils.ts for rot13() function.
                _StdOut.putText(args.join(' ') + " = '" + Utils.rot13(args.join(' ')) +"'");
            } else {
                _StdOut.putText("Usage: rot13 <string>  Please supply a string.");
            }
        }

        public shellPrompt(args: string[]) {
            if (args.length > 0) {
                _OsShell.promptStr = args[0];
            } else {
                _StdOut.putText("Usage: prompt <string>  Please supply a string.");
            }
        }

        // current date and time display
        public shellDate(args: string[]) {
            const now = new Date();
            _StdOut.putText("Cureent date and time: " + now.toLocaleString());
        }

        // user's location
        public shellLocation(args: string[]) {
            const location = [
                "The main frame.",
                "The chocolate factory",
                "The Cheese Cake Factory"
            ];
            const randomIndex = Math.floor(Math.random() * location.length); // had AI help with writing this randomization script
            _StdOut.putText(location[randomIndex]);
        }

        // fun facts
        public shellFact(args: string[]) {
            const facts = [
                "Some tree species are able to taste. Trees can distiguish bud species by their saliva allowing them to either make " +
                "their leaves bitter so the bug leaves, or send a chemical signal through the air to alert that bug's prdators so they can come and eat them.",
                "Soil is the worlds largest carbon sink.",
                "In the study of quantum mechanics, if you were to magnify an atom to be the size of the observable universe, a string would be the size of a tree."
            ];
            const randomIndex = Math.floor(Math.random() * facts.length); // had AI help with writing this randomization script
            _StdOut.putText(facts[randomIndex]);
        }

        // current status
        public shellStatus(args: string[])
        {
            if(args.length > 0)
            {
                const statusMessage = args.join(" ");
                window["updateStatus"](statusMessage); // needed some AI help with this part (specifically the window object)
            }
            else
            {
                _StdOut.putText("Usage: status <string> - Please supply a status message.");
            }
        }

        // load method for assemply
        public shellLoad(args: string[]) {
            // I had AI help with the setup with this line, specifically the incorporation of HTMLTextAreaElement. It represents a <textarea> element, mine being taProgramInput
            // it allows you to access its properties and methods specific to text areas, which is necessay to access the .value property
            const userInput = (document.getElementById("taProgramInput") as HTMLTextAreaElement).value; 
            let isValid = true;
        
            // loop to check each character of the taProgramInput
            for (let i = 0; i < userInput.length; i++) {
                const char = userInput[i];
                
                // checks if the char is a digit
                if (!(char >= '0' && char <= '9') &&
                    // checks if the character is an uppercase letter (A-F)
                    !(char >= 'A' && char <= 'F') &&
                    // Check if the char is a space
                    !(char === ' ')) {
                    isValid = false;
                    break;
                }
            }
            // outputs whether or not the input is valid
            if (isValid) {
                _StdOut.putText("Input is valid.");
            } else {
                _StdOut.putText("Input is invalid. Only hex digits (0-9, A-F) and spaces");
            }
        }

        // BSOD command to test screen of death
        public shellbsod(args: string[]) {
            // variable to store my bsod
            const img = new Image();
            img.src = "/Users/aidanoleary/Desktop/OS-God_main/error.png";
            img.onload =
                _DrawingContext.clearScreen();
                _DrawingContext.drawImage(img, 0, 0, _Canvas.width, _Canvas.height);
        }

    }
}
