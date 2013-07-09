/*
Author : Sujith K.P
Initial Release.

*/

(function ($) {

    $.fn.setAsStickyNoteWorkSpace = function (args) {

        var pointerX = 0;
        var pointerY = 0;
        var minWidth = 200;
        var minHeight = 100;
        var footerHeight = undefined;
        var titleBarHeight = undefined;
        var stickyNoteManager = new StickyNoteManager();

        var command = null;
        var stickyCount = 0;
        var mouseDown = false;
        var wasResizing = false;

        var stickyNoteInFocus = null;
        var workSpaceId = $(this).attr('id');

        var onCreate = undefined;
        var onClose = undefined;
        var onDirty = undefined;

        if (!(args == undefined || args == null)) {
            onCreate = args.onCreate;
            onClose = args.onClose;
            onDirty = args.onDirty;
        }

        //returns full date time.
        function getDateTime() {
            var currentdate = new Date();
            var datetime = currentdate.getDate() + "/"
                + (currentdate.getMonth() + 1) + "/"
                + currentdate.getFullYear() + " "
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();
            return datetime;
        }

        //generates stickynote Id from date at which it is created.
        function getStickyId() {
            var currentdate = new Date();
            var datetime = currentdate.getDate() + ""
                + (currentdate.getMonth() + 1) +
                +currentdate.getFullYear() + ""
                + currentdate.getHours() + ""
                + currentdate.getMinutes() + ""
                + currentdate.getSeconds();
            return datetime;
        }

        //builds the skelton of the stickynote.
        function getNoteHtml(stickyId, footertext) {
            var collapseBtn = "<div class = 'CollapseBtn'>^</div>";
            var closeBtn = "<div class = 'CloseButton'>X</div>";
            var titlebar = "<div class = 'TitleBar'>" + collapseBtn + closeBtn + "</div>";
            var editor = "<textarea />";
            var bodyDiv = "<div class = 'body'>" + editor + " </div>";
            var resizer = "<div class = 'Resizer'> </div>";
            var footer = "<div class = 'Footer'>" + footertext + resizer + "</div>";

            var stickyDiv = "<div id = '" + stickyId + "' class = 'Sticky Tilted' >"
                            + titlebar + bodyDiv + footer
                            + "</div>";
            return stickyDiv;
        }

        function getNewNoteHtml() {
            var stickyId = getStickyId();
            return getNoteHtml(stickyId, getDateTime());
        }

        function StickyNote() { }

        StickyNote.prototype.node = undefined;
        StickyNote.prototype.id = undefined;

        StickyNote.prototype.getText = function () {
            return $(this.getSelector()).find("textarea").val();
        };

        StickyNote.prototype.setText = function (str) {
            return $(this.getSelector()).find("textarea").val(str);
        };

        StickyNote.prototype.close = function () {
            $(this.getSelector()).remove();
        };

        StickyNote.prototype.getHeight = function () {
            return $(this.getSelector()).css('height');
        };

        StickyNote.prototype.setHeight = function (height) {
            return $(this.getSelector()).css('height', height);
        };

        StickyNote.prototype.setWidth = function (width) {
            return $(this.getSelector()).css('width', width);
        };

        StickyNote.prototype.getWidth = function () {
            return $(this.getSelector()).css('width');
        };

        StickyNote.prototype.getSelector = function () {
            return "#" + this.id;
        };

        StickyNote.prototype.getJSON = function () {
            return {
                id: $(this.node).attr('id'),
                clientX: $(this.node).css('left'),
                clientY: $(this.node).css('top'),
                height: $(this.node).css('height'),
                width: $(this.node).css('width'),
                text: this.getText(),
                createdOn: $(this.node).find(".Footer").text().trim()
            };
        };

        function resize(args) {
            var currHeight = parseInt($(stickyNoteInFocus).css('height'));
            var currWidth = parseInt($(stickyNoteInFocus).css('width'));

            var currPointerX = args.clientX;
            var currPointerY = args.clientY;

            var changeInX = currPointerX - pointerX;
            var changeInY = currPointerY - pointerY;

            var newHeight = currHeight + changeInY;
            var newWidth = currWidth + changeInX;

            if (newHeight >= minHeight)
                resizeNoteHeight(stickyNoteInFocus, newHeight);

            if (newWidth >= minWidth)
                resizeNoteWidth(stickyNoteInFocus, newWidth);

            pointerX = currPointerX;
            pointerY = currPointerY;
        }

        $(".Resizer").live('mousedown', function (args) {
            command = "resize";
            stickyNoteInFocus = $(this).parent().parent();
            pointerX = args.clientX;
            pointerY = args.clientY;
        });

        function resizeNoteHeight(note, height) {
            $(note).css('height', height);

            if (titleBarHeight == undefined)
                titleBarHeight = parseInt($(".Sticky").find(".TitleBar").css('height'));

            if (footerHeight == undefined)
                footerHeight = parseInt($(".Sticky").find(".Footer").css('height'));

            $(note).find('.body').css('height', parseInt(height) - titleBarHeight - footerHeight - 10 + "px");
        }

        function resizeNoteWidth(note, width) {
            $(note).css('width', width);
        }

        function move(args) {
            var currY = parseInt($(stickyNoteInFocus).css('top'));
            var currX = parseInt($(stickyNoteInFocus).css('left'));

            var currPointerX = args.clientX;
            var currPointerY = args.clientY;

            var changeInX = currPointerX - pointerX;
            var changeInY = currPointerY - pointerY;

            $(stickyNoteInFocus).css('left', currX + changeInX);
            $(stickyNoteInFocus).css('top', currY + changeInY);

            pointerX = currPointerX;
            pointerY = currPointerY;
        }

        function getNote(node) {
            var note = new StickyNote();
            note.node = node;
            note.id = $(note.node).attr('id');
            return note;
        }

        function textarea_changed(args) {
            var node = $(args.target).parent().parent();
            var note = getNote(node);
            if (onDirty != undefined)
                onDirty(note);
        }

        function createNewStickyNote() {
            var note = new StickyNote();
            note.node = getNewNoteHtml();
            note.id = $(note.node).attr('id');
            return note;
        }

        function render(note, x, y) {
            note.node = $(note.node).css('left', x).css('top', y);
            $("#" + workSpaceId).append(note.node);
        }

        $(this).mousedown(function () {
            mouseDown = true;
        });

        function bringtofront(currentNote) {
            $(".Sticky").css('z-index', 0);
            $(currentNote).css('z-index', 999);
        };

        $(".Sticky").live('click', function () {
            bringtofront($(this));
        });

        $(".CollapseBtn, .CloseButton").live('mouseover', function () {
            $(this).addClass("GlassyFocused");
        });

        $(".CollapseBtn, .CloseButton").live('mouseleave', function () {
            $(this).removeClass("GlassyFocused");
        });

        $(".CollapseBtn").live('click', function () {
            if ($(this).text() == "^") {
                $(this).text("v");
                var height = $(this).parent().parent().css('height');
                $(this).parent().parent().data('height', height);
                resizeNoteHeight($(this).parent().parent(), 50);
                $(this).parent().parent().find("textarea").hide();
            }
            else {
                $(this).text("^");
                var height = $(this).parent().parent().data('height');
                resizeNoteHeight($(this).parent().parent(), height);
                $(this).parent().parent().find("textarea").show();
            }
        });

        $(document).mousemove(function (e) {
            switch (command) {
                case "move":
                    move(e);
                    break;
                case "resize":
                    resize(e);
                    break;
            }

            if (mouseDown == true)
                wasResizing = true;

            e.preventDefault();
        });

        $(".TitleBar").live('mousedown', function (args) {
            command = "move";
            pointerX = args.clientX;
            pointerY = args.clientY;
            bringtofront($(this).parent());
            stickyNoteInFocus = $(this).parent();
        });

        $(".CloseButton").live('click', function () {
            var note = new StickyNote();
            note.node = $(this).parent().parent();
            note.id = $(note.node).attr('id');
            if (onClose != undefined)
                onClose(note);
            note.close();
        });

        $(document).mouseup(function (args) {
            command = null;

            if (wasResizing && onDirty != undefined && stickyNoteInFocus != null)
                onDirty(getNote(stickyNoteInFocus));

            wasResizing = mouseDown = false;
            stickyNoteInFocus = null;
        });

        $(this).click(function (args) {

            if (wasResizing == true || args.target.id != workSpaceId) {
                wasResizing = mouseDown = false;
                return;
            }

            var newNote = stickyNoteManager.createNewNote(args);
            mouseDown = false;

            if (onCreate != undefined && onCreate != null)
                onCreate(newNote);
        });

        function StickyNoteManager() {

        }

        StickyNoteManager.prototype.createNewNote = function (args) {
            var newNote = createNewStickyNote();
            render(newNote, args.clientX, args.clientY);
            $(newNote.getSelector()).find("textarea").bind('change', textarea_changed);
            $(newNote.getSelector()).find("textarea").focus();
            bringtofront(newNote.node);
            return newNote;
        };

        StickyNoteManager.prototype.showNote = function (item) {
            
            var note = new StickyNote();
            note.node = getNoteHtml(item.id, item.createdOn);
            note.id = $(note.node).attr('id');
            
            render(note, item.clientX, item.clientY);
            
            $(note.getSelector()).find("textarea").bind('change', textarea_changed);
            
            note.setHeight(item.height);
            note.setWidth(item.width);
            note.setText(item.text);

            resizeNoteWidth(note.node, item.width);
            resizeNoteHeight(note.node, item.height);
        };

        return new StickyNoteManager();
    }
})(jQuery);
