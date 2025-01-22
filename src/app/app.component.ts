import { Component, OnInit } from '@angular/core';
import * as braintree from 'braintree-web';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  hostedFieldsInstance: braintree.HostedFields;
  cardholdersName: string;

  ngOnInit() {
    this.createBraintreeUI(); // in afterViewInit so that the view is
                              // initialised before event listeners are added to them
  }

  createBraintreeUI() {
    braintree.client.create({
      authorization: 'sandbox_gphvx7p3_g7mpzfk6pq3fgstw'
    }).then((clientInstance) => {
      braintree.hostedFields.create({
        client: clientInstance,
        styles: {
          // Override styles for the hosted fields
        },

        // The hosted fields that we will be using
        // NOTE : cardholder's name field is not available in the field options
        // and a separate input field has to be used incase you need it
        fields: {
          number: {
            selector: '#card-number',
            placeholder: '1111 1111 1111 1111'
          },
          cvv: {
            selector: '#cvv',
            placeholder: '111'
          },
          expirationDate: {
            selector: '#expiration-date',
            placeholder: 'MM/YY'
          }
        }
      }).then((hostedFieldsInstance) => {

        this.hostedFieldsInstance = hostedFieldsInstance;

        hostedFieldsInstance.on('focus', (event) => {
          const field = event.fields[event.emittedBy];
          const label = this.findLabel(field);
          label.classList.remove('filled'); // added and removed css classes
          // can add custom code for custom validations here
        });

        hostedFieldsInstance.on('blur', (event) => {
          const field = event.fields[event.emittedBy];
          const label = this.findLabel(field); // fetched label to apply custom validations
          // can add custom code for custom validations here
        });

        hostedFieldsInstance.on('empty', (event) => {
          const field = event.fields[event.emittedBy];
          // can add custom code for custom validations here
        });

        hostedFieldsInstance.on('validityChange', (event) => {
          const field = event.fields[event.emittedBy];
          const label = this.findLabel(field);
          if (field.isPotentiallyValid) { // applying custom css and validations
            label.classList.remove('invalid');
          } else {
            label.classList.add('invalid');
          }
          // can add custom code for custom validations here
        });
      });
    });
  }

  // Tokenize the collected details so that they can be sent to your server
  tokenizeUserDetails() {
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

          let v;
for (v of Object.values(tokenizeErr.details.invalidFields))  {
v.className = 'hosted-field braintree-hosted-fields-invalid';
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
