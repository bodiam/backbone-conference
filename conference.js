$(function(){

// Model
var Conference = Backbone.Model.extend({
    defaults: function() {
	return {
	    name: 'Many Conference',
	    description: '',
	    startDate: new Date(),
	    endDate: new Date()
	};
    },
    localStorage: new Backbone.LocalStorage("conference-backbone"),
    
    initialize: function() {
	this.sessions = new SessionList;
    }
});


var Session = Backbone.Model.extend({
    defaults: function() {
	return {
	    speaker: 'Erik Pragt',
	    title: 'TBD',
	    done: false
	};
    },

    // Toggle the `done` state of this session item.
    toggle: function() {
      this.save({done: !this.get("done")});
    }
});

var SessionList = Backbone.Collection.extend({
    model: Session,
    localStorage: new Backbone.LocalStorage("sessions-backbone"),

    // Filter down the list of all todo items that are finished.
    done: function() {
      return this.where({done: true});
    },

    // Filter down the list to only todo items that are still not finished.
    remaining: function() {
      return this.where({done: false});
    },
});

// var sessions = new SessionList;

var conference = new Conference;

// Views

var ConferenceView = Backbone.View.extend({
    el: $("#conference-details"),
    template: _.template($('#conference-template').html()),

    render: function() {
	this.$el.html(this.template(this.model.toJSON()));
	this.input = this.$('.edit');
        return this;
    },
});

var SessionView = Backbone.View.extend({
    tagName: "li",

    template: _.template($('#session-template').html()),

    events: {
	"click .toggle"   : "toggleDone",
	"dblclick .view"  : "edit",
	"click a.destroy" : "clear",
	"keypress .edit"  : "updateOnEnter",
	"blur .edit"	  : "close"
    },

    initialize: function() {
      this.listenTo(this.model, 'change', this.render);
      this.listenTo(this.model, 'destroy', this.remove);
    },

    // Re-render the titles of the session item.
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.toggleClass('done', this.model.get('done'));
      this.input = this.$('.edit');
      return this;
    },

    // Toggle the `"done"` state of the model.
    toggleDone: function() {
      this.model.toggle();
    },

    // Switch this view into `"editing"` mode, displaying the input field.
    edit: function() {
      this.$el.addClass("editing");
      this.input.focus();
    },

    // Close the `"editing"` mode, saving changes to the session.
    close: function() {
      var value = this.input.val();
      if (!value) {
        this.clear();
      } else {
        this.model.save({title: value});
        this.$el.removeClass("editing");
      }
    },

    // If you hit `enter`, we're through editing the item.
    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },

    // Remove the item, destroy the model.
    clear: function() {
      this.model.destroy();
    }
});

// The Application
// ---------------

// Our overall **AppView** is the top-level piece of UI.
var AppView = Backbone.View.extend({

    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("#conferenceapp"),

    // Our template for the line of statistics at the bottom of the app.
    statsTemplate: _.template($('#stats-template').html()),

    // Delegated events for creating new items, and clearing completed ones.
    events: {
      "keypress #new-session":  "createOnEnter",
      "click #saveConference": "saveConference",
      "click #clear-completed": "clearCompleted",
      "click #toggle-all": "toggleAllComplete"
    },


    // At initialization we bind to the relevant events on the `Sessions`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting session that might be saved in *localStorage*.
    initialize: function() {

      this.input = this.$("#new-session");
      this.conferenceName = this.$("#conference-name");
      this.allCheckbox = this.$("#toggle-all")[0];

      this.listenTo(conference.sessions, 'add', this.addOne);
      this.listenTo(conference.sessions, 'reset', this.addAll);
      this.listenTo(conference.sessions, 'all', this.render);
      this.listenTo(conference, 'all', this.render);

      this.footer = this.$('footer');
      this.main = $('#main');

      conference.sessions.fetch();
    },

   // Re-rendering the App just means refreshing the statistics -- the rest
    // of the app doesn't change.
    render: function() {
      var done = conference.sessions.done().length;
      var remaining = conference.sessions.remaining().length;

      if (conference.sessions.length) {
        this.main.show();
        this.footer.show();
        this.footer.html(this.statsTemplate({done: done, remaining: remaining}));
      } else {
        this.main.hide();
        this.footer.hide();
      }

      this.allCheckbox.checked = !remaining;
    },

   // Add a single session item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(session) {
      var view = new SessionView({model: session});
      this.$("#session-list").append(view.render().el);
    },

    // Add all items in the **sessions** collection at once.
    addAll: function() {
      conference.sessions.each(this.addOne, this);
    },

    // If you hit return in the main input field, create new **Session** model,
    // persisting it to *localStorage*.
    createOnEnter: function(e) {
      if (e.keyCode != 13) return;
      if (!this.input.val()) return;

      conference.sessions.create({title: this.input.val()});
      this.input.val('');
    },

    saveConference: function(e) {
       conference.set('name', $("#conference-name").val());
    },

    // Clear all done session items, destroying their models.
    clearCompleted: function() {
      _.invoke(conference.sessions.done(), 'destroy');
      return false;
    },

    toggleAllComplete: function () {
      var done = this.allCheckbox.checked;
      conference.sessions.each(function (session) { session.save({'done': done}); });
    }

  });

  // Finally, we kick things off by creating the **App**.
  var app = new AppView;
  var conferenceView = new ConferenceView({model:conference}).render();


});
