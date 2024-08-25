var TSOS;
(function (TSOS) {
    class UserCommand {
        command;
        args;
        constructor(command = "", args = []) {
            this.command = command;
            this.args = args;
        }
    }
    TSOS.UserCommand = UserCommand;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=userCommand.js.map