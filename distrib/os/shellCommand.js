var TSOS;
(function (TSOS) {
    class ShellCommand {
        func;
        command;
        description;
        constructor(func, command = "", description = "") {
            this.func = func;
            this.command = command;
            this.description = description;
        }
    }
    TSOS.ShellCommand = ShellCommand;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=shellCommand.js.map