import {Component, ElementRef, OnInit, Renderer2, ViewChild} from '@angular/core';
import * as braintree from 'braintree-web';
import * as $ from 'jquery';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
@ViewChild('ccName') ccName: ElementRef;
@ViewChild('email') email: ElementRef;

  hostedFieldsInstance: braintree.HostedFields;
  cardholdersName: string;

  constructor(private renderer: Renderer2) {
  }

  ngOnInit() {
    this.createBraintreeUI();



    // var ccName = $('#cc-name');
    // var email = $('#email');
    //
    // ccName.on('change', function () {
    //  // @ts-ignore
    //   this.validateInput(ccName);
    // });
    //
    // email.on('change', this.validateEmail);
  }


     validateInput(element) {
      // very basic validation, if the
      // fields are empty, mark them
      // as invalid, if not, mark them
      // as valid

      if (!element.value.trim()) {
        this.setValidityClasses(element, false);

        return false;
      }

      this.setValidityClasses(element, true);

      return true;
    }

     validateEmail () {
      var baseValidity = this.validateInput(this.email.nativeElement);

      if (!baseValidity) {
        return false;
      }

      if (this.email.nativeElement.value.indexOf('@') === -1) {
        this.setValidityClasses(this.email.nativeElement, false);
        return false;
      }

      this.setValidityClasses(this.email.nativeElement, true);
      return true;
    }

    setValidityClasses(element, validity) {
      if (validity) {
        this.renderer.removeClass(element, 'is-invalid');
        this.renderer.addClass(element, 'is-valid');
      } else {
        this.renderer.addClass(element, 'is-invalid');
        this.renderer.removeClass(element, 'is-valid');
      }
    }


  createBraintreeUI() {

braintree.client.create({
  authorization: 'sandbox_g42y39zw_348pk9cgf3bgyw2b'
}, function(err, clientInstance) {
  if (err) {
    console.error(err);
    return;
  }

  braintree.hostedFields.create({
    // preventAutofill: false,
    client: clientInstance,
    styles: {
      input: {
        // change input styles to match
        // bootstrap styles
        'font-size': '1rem',
        color: '#495057'
      }
    },
    fields: {
      cardholderName: {
        selector: '#cc-name',
        placeholder: 'Name as it appears on your card'
      },
      number: {
        selector: '#cc-number',
        placeholder: '4111 1111 1111 1111'
      },
      cvv: {
        selector: '#cc-cvv',
        placeholder: '123'
      },
      expirationDate: {
        selector: '#cc-expiration',
        placeholder: 'MM / YY'
      }
    }
  }, function(err, hostedFieldsInstance) {
    if (err) {
      console.error(err);
      return;
    }

    hostedFieldsInstance.on('cardTypeChange', function(event) {
      var cardBrand = $('#card-brand');
      var cvvLabel = $('[for="cc-cvv"]');

      if (event.cards.length === 1) {
        var card = event.cards[0];

        // change pay button to specify the type of card
        // being used
        cardBrand.text(card.niceType);
        // update the security code label
        cvvLabel.text(card.code.name);
      } else {
        // reset to defaults
        cardBrand.text('Card');
        cvvLabel.text('CVV');
      }
    });


    hostedFieldsInstance.on('validityChange', function(event) {
      var field = event.fields[event.emittedBy];

      // Remove any previously applied error or warning classes
      $(field.container).removeClass('is-valid');
      $(field.container).removeClass('is-invalid');

      if (field.isValid) {
        $(field.container).addClass('is-valid');
      } else if (field.isPotentiallyValid) {
        // skip adding classes if the field is
        // not valid, but is potentially valid
      } else {
        $(field.container).addClass('is-invalid');
      }
    });

    // function



  });
});
  }

  // Tokenize the collected details so that they can be sent to your server
  tokenizeUserDetails(event) {
    event.preventDefault();

      var formIsInvalid = false;
      var state = this.hostedFieldsInstance.getState();

      // perform validations on the non-Hosted Fields
      // inputs
      if (!this.validateEmail()) {
        formIsInvalid = true;
      }

      // Loop through the Hosted Fields and check
      // for validity, apply the is-invalid class
      // to the field container if invalid
      Object.keys(state.fields).forEach(function(field) {
        if (!state.fields[field].isValid) {
          $(state.fields[field].container).addClass('is-invalid');
          formIsInvalid = true;
        }
      });

      if (formIsInvalid) {
        // skip tokenization request if any fields are invalid
        return;
      }


    this.hostedFieldsInstance.tokenize({cardholderName: this.cardholdersName}).then((payload) => {
      console.log(payload);
       // Example payload return on succesful tokenization

      /* {nonce: "tokencc_bh_hq4n85_gxcw4v_dpnw4z_dcphp8_db4", details: {…},
      description: "ending in 11", type: "CreditCard", binData: {…}}
      binData: {prepaid: "Unknown", healthcare: "Unknown", debit: "Unknown", durbinRegulated: "Unknown", commercial: "Unknown", …}
      description: "ending in 11"
      details: {bin: "411111", cardType: "Visa", lastFour: "1111", lastTwo: "11"}
      nonce: "tokencc_bh_hq4n85_gxcw4v_dpnw4z_dcphp8_db4"
      type: "CreditCard"
      __proto__: Object
      */

      // submit payload.nonce to the server from here
    }).catch((tokenizeErr) => {
      switch (tokenizeErr.code) {
        case 'HOSTED_FIELDS_FIELDS_EMPTY':
          // occurs when none of the fields are filled in
          console.error('All fields are empty! Please fill out the form.');

          break;
        case 'HOSTED_FIELDS_FIELDS_INVALID':
          // occurs when certain fields do not pass client side validation
          console.error('Some fields are invalid:', tokenizeErr.details.invalidFieldKeys);

          // you can also programmatically access the field containers for the invalid fields
          // tokenizeErr.details.invalidFields.forEach(function(fieldContainer) {
          //   fieldContainer.className = 'invalid';
          // });

          let v2;
for (v2 of Object.values(tokenizeErr.details.invalidFields))  {
v2.className = 'hosted-field braintree-hosted-fields-invalid';
}

          break;
        case 'HOSTED_FIELDS_TOKENIZATION_FAIL_ON_DUPLICATE':
          // occurs when:
          //   * the client token used for client authorization was generated
          //     with a customer ID and the fail on duplicate payment method
          //     option is set to true
          //   * the card being tokenized has previously been vaulted (with any customer)
          // See: https://developer.paypal.com/braintree/docs/reference/request/client-token/generate#options.fail_on_duplicate_payment_method
          console.error('This payment method already exists in your vault.');
          break;
        case 'HOSTED_FIELDS_TOKENIZATION_CVV_VERIFICATION_FAILED':
          // occurs when:
          //   * the client token used for client authorization was generated
          //     with a customer ID and the verify card option is set to true
          //     and you have credit card verification turned on in the Braintree
          //     control panel
          //   * the cvv does not pass verification (https://developer.paypal.com/braintree/docs/reference/general/testing#avs-and-cvv/cid-responses)
          // See: https://developer.paypal.com/braintree/docs/reference/request/client-token/generate#options.verify_card
          console.error('CVV did not pass verification');
          break;
        case 'HOSTED_FIELDS_FAILED_TOKENIZATION':
          // occurs for any other tokenization error on the server
          console.error('Tokenization failed server side. Is the card valid?');
          break;
        case 'HOSTED_FIELDS_TOKENIZATION_NETWORK_ERROR':
          // occurs when the Braintree gateway cannot be contacted
          console.error('Network error occurred when tokenizing.');
          break;
        default:
          console.error('Something bad happened!', tokenizeErr);
        // perform custom validation here or log errors
      }
    });
  }

  // Fetches the label element for the corresponding field
  findLabel(field: any) {
    return document.querySelector('.hosted-field--label[for="' + field.container.id + '"]');
  }
}
