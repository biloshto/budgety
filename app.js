// Budget controller
let budgetController = (function() {

  // when we need to create lots of objects we create function constructors which we can then use to instantiate lots of objects, expense and income objects, and like that we basically create a custom data type, one for incomes, and one for expenses
  let Income = function(id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
  };

  let Expense = function(id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
    this.percentage = -1;
  };

  Expense.prototype.calcPercentage = function(totalIncome) {
    if(totalIncome > 0) {
      this.percentage = Math.round((this.value / totalIncome) * 100);
    } else {
      this.percentage = -1;
    }
  };

  Expense.prototype.getPercentage = function() {
    return this.percentage;
  };

  let calculateTotal = function(type) {
    let sum = 0;
    data.allItems[type].forEach(function(current) {
      sum += current.value;
    });
    data.totals[type] = sum;
  };

  let data = {
    allItems: {
      inc: [],
      exp: []
    },
    totals: {
      inc: 0,
      exp: 0
    },
    budget: 0,
    percentage: -1
  };

  return {
    addItem: function(type, des, val) {
      let newItem, ID;

      // [1 2 3 4 5], next ID is 6
      // [1 2 4 6 8], after deleting next ID should be 9, not 6
      // ID = last ID + 1

      // Create new ID
      if(data.allItems[type].length > 0) {
        ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
      } else {
        ID = 0;
      }

      // the 'new' keyword creates a new empty object and calls the function and points to 'this' keyword of that function to the new object that was created, so when we then set properties on that 'this' keyword we automatically set them on the new object that was created here

      // Create new item based on 'inc' or 'exp' type
      if(type === "inc"){
        newItem = new Income(ID, des, val);
      } else if(type === "exp") {
        newItem = new Expense(ID, des, val);
      }

      // Push it into our data structure
      data.allItems[type].push(newItem);

      // Return the new element
      return newItem;      
    },

    deleteItem: function(type, id) {
      let ids, index;
      // our array may be unordered, for example arr=[1 2 4 6 8] - so the element with the ID of 4 is not in the arr[4]
      // map is similar to forEach but it returns a brand new array
      // id=6; ids=[1 2 4 6 8]; index=3
      ids = data.allItems[type].map(function(current) {
        return current.id;
      });
      index = ids.indexOf(id);

      // if index is -1, the item which we are searching for was not found in the array
      if(index !== -1) {
        data.allItems[type].splice(index, 1); // removes an element at the index position
      }
    },

    calculateBudget: function() {
      // Calculate total income and expenses
      calculateTotal("inc");
      calculateTotal("exp");

      // Calculate the budget: income - expenses
      data.budget = data.totals.inc - data.totals.exp;

      // Calculate the percentage of income that we spent: expenses divaded with incomes multiplied by 100
      if(data.totals.inc > 0) {
        data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
      } else {
        data.percentage = -1;
      }
      
    },

    calculatePercenteges: function() {
      // a=20, b=10, c=40, income=100 ---> a=20/100=20%, b=10%, c=40%
      
      data.allItems.exp.forEach(function(current) {
        current.calcPercentage(data.totals.inc);
      });
    },

    getPercentages: function() {
      let allPerc = data.allItems.exp.map(function(current) {
        return current.getPercentage();
      });
      return allPerc;
    },

    getBudget: function() {
      return {
        budget: data.budget,
        totalInc: data.totals.inc,
        totalExp: data.totals.exp,
        percentage: data.percentage
      };
    },

    testing: function() {
      console.log(data);
    }
  };

})();



// UI controller
let UIController = (function() {

  let DOMselectors = {
    inputType: ".add__type",
    inputDescription: ".add__description",
    inputValue: ".add__value",
    inputButton: ".add__btn",
    incomeContainer: ".income__list",
    expensesContainer: ".expenses__list",
    budgetLabel: ".budget__value",
    incomeLabel: ".budget__income--value",
    expensesLabel: ".budget__expenses--value",
    percentageLabel: ".budget__expenses--percentage",
    container: ".container",
    expensesPercLabel: ".item__percentage",
    dateLabel: ".budget__title--month"
  };

  let formatNumber = function(num, type) {
    let numSplit, int, dec;

    // + or - before the number depending on the type; exactly 2 decimal points; comma separating the thousands --> so 2310 in the income will be + 2,310.00, and 53.5668 in the outcome will be - 53.57

    num = Math.abs(num);
    num = num.toFixed(2); // rounds the number to 2 decimals, but it returns it as a string

    numSplit = num.split(".");
    int = numSplit[0];
    dec = numSplit[1];

    if(int.length > 3) {
      // substring (substr) allows us only to take a part of a string; it takes the index number where we want to start as the first argument, and the second argument is how many characters we want
      int = int.substr(0, int.length - 3) + "," + int.substr(int.length - 3, 3); // input 23510 --> output 23,510
    }

    return (type === "exp" ? "-" : "+") + " " + int + "." + dec;
  };

  let nodeListForEach = function(list, callback) {
    for(let i=0; i<list.length; i++) {
      callback(list[i], i);
    }
  };

  return {
    getInput: function() {
      let type = document.querySelector(DOMselectors.inputType).value; // will be either inc (for income) or exp (for expense)
      let description = document.querySelector(DOMselectors.inputDescription).value;
      let value = parseFloat(document.querySelector(DOMselectors.inputValue).value); // otherwise, it returns a string

      // We have to return something here, so the best solution is to return an object containing the three values as properties
      return {
        type,
        description,
        value
      }
    },

    addListItem: function(obj, type) {
      // Create HTML string with placeholder text
      let html, newHtml, element;

      if(type === "inc") {
        element = DOMselectors.incomeContainer;
        html = `
          <div class="item clearfix" id="inc-%id%">
            <div class="item__description">%description%</div>
            <div class="right clearfix">
              <div class="item__value">%value%</div>
              <div class="item__delete">
                <button class="item__delete--btn">
                  <i class="ion-ios-close-outline"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      } else if(type === "exp") {
        element = DOMselectors.expensesContainer;
        html = `
          <div class="item clearfix" id="exp-%id%"">
            <div class="item__description">%description%</div>
            <div class="right clearfix">
              <div class="item__value">%value%</div>
              <div class="item__percentage">%percentage%</div>
              <div class="item__delete">
                <button class="item__delete--btn">
                  <i class="ion-ios-close-outline"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }

      // Replace the placeholder text with some actual data
      newHtml = html.replace("%id%", obj.id);
      newHtml = newHtml.replace("%description%", obj.description);
      newHtml = newHtml.replace("%value%", formatNumber(obj.value, type));

      // Insert the HTML into the DOM
      // beforeend means it will insert the HTML as the last child in the list
      document.querySelector(element).insertAdjacentHTML("beforeend", newHtml);
    },

    deleteListItem: function(selectorID) {
      // since we can't delete an element, we need to first select the element and then go to its parent and from there delete the child which is the element that we want to delete
      let el = document.getElementById(selectorID);
      el.parentElement.removeChild(el);
    },

    clearFields: function() {
      // document.querySelector(DOMselectors.inputType).value = "inc";
      document.querySelector(DOMselectors.inputDescription).value = "";
      document.querySelector(DOMselectors.inputValue).value = "";

      // Set the focus on the description
      document.querySelector(DOMselectors.inputDescription).focus();
    },

    displayBudget: function(obj) {
      let type;
      obj.budget > 0 ? type = "inc" : type = "exp";

      document.querySelector(DOMselectors.budgetLabel).textContent = formatNumber(obj.budget, type);
      document.querySelector(DOMselectors.incomeLabel).textContent = formatNumber(obj.totalInc, "type");
      document.querySelector(DOMselectors.expensesLabel).textContent = formatNumber(obj.totalExp, "exp");      

      if(obj.percentage > 0) {
        document.querySelector(DOMselectors.percentageLabel).textContent = obj.percentage +"%";
      } else {
        document.querySelector(DOMselectors.percentageLabel).textContent = "---";
      }
    },

    displayPercentages: function(percentages) {
      let fields = document.querySelectorAll(DOMselectors.expensesPercLabel);

      nodeListForEach(fields, function(current, index) {
        if(percentages[index] > 0) {
          current.textContent = percentages[index] + "%";
        } else {
          current.textContent = "---";
        }
        
      });
    },

    displayDate: function() {
      let now, month, year, months;
      
      now = new Date();
      months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      month = now.getMonth();
      year = now.getFullYear();
      document.querySelector(DOMselectors.dateLabel).textContent = months[month] + " " + year;
    },

    changedType: function() {
      let fields;

      fields = document.querySelectorAll(DOMselectors.inputType + "," + DOMselectors.inputDescription + "," + DOMselectors.inputValue);

      nodeListForEach(fields, function(current) {
        current.classList.toggle("red-focus");
      });

      document.querySelector(DOMselectors.inputButton).classList.toggle("red");
    },

    getDOMselector: function() {
      return DOMselectors;
    }
  }

})();



// Global app controller
let controller = (function(budgetCtrl, UICtrl) {

  let setupEventListeners = function() {

    let DOM = UICtrl.getDOMselector();

    // Add Item button event listener
    document.querySelector(DOM.inputButton).addEventListener("click", ctrlAddItem);

    // On pressing the Enter key we'll be able to add the item to the budget controller
    document.addEventListener("keypress", function(e) {
      // e.which is for older browsers that don't have the keyCode property
      if(e.keyCode === 13 || e.which === 13) {
        ctrlAddItem();
      }
    });

    document.querySelector(DOM.container).addEventListener("click", ctrlDeleteItem);

    document.querySelector(DOM.inputType).addEventListener("change", UICtrl.changedType);

  }

  let updateBudget = function() {
    // Calculate the budget
    budgetCtrl.calculateBudget();

    // Return the budget
    let budget = budgetCtrl.getBudget();
  
    // Display the budget
    UICtrl.displayBudget(budget);
  }

  let updatePercentages = function() {
    // Calculate percentages
    budgetCtrl.calculatePercenteges();

    // Read percentages from the budget controller
    let percentages = budgetCtrl.getPercentages();

    // Update the UI with the new percentages
    UICtrl.displayPercentages(percentages);
  }

  let ctrlAddItem = function() {
    let input, newItem;

    // Get the field input data
    input = UICtrl.getInput();

    if(input.description !== "" && !isNaN(input.value) && input.value > 0) {
      // Add the item to the budget controller
      newItem = budgetCtrl.addItem(input.type, input.description, input.value);
    
      // Add the item to the UI
      UICtrl.addListItem(newItem, input.type);

      // Clear fields
      UICtrl.clearFields();
    
      // Calculate and update budget
      updateBudget();

      // Calculate and update percentages
      updatePercentages();
    }
  }

  let ctrlDeleteItem = function(e) {
    let itemID, splitID, type, ID;
    
    itemID = e.target.parentElement.parentElement.parentElement.parentElement.id;
    
    if(itemID) {
      // IDs: inc-1, exp-1
      splitID = itemID.split("-");      
      type = splitID[0];
      ID = parseInt(splitID[1]);
      
      // Delete the item from the data structure
      budgetCtrl.deleteItem(type, ID);

      // Delete the item from the UI
      UICtrl.deleteListItem(itemID);

      // Update and show the new budget
      updateBudget();

      // Calculate and update percentages
      updatePercentages();
    }
  }

  return {
    init: function() {
      // Display the budget
      UIController.displayDate();
      UICtrl.displayBudget({
        budget: 0,
        totalInc: 0,
        totalExp: 0,
        percentage: -1
      });
      setupEventListeners();
    }
  };

})(budgetController, UIController);

controller.init();