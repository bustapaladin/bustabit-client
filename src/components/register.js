import React, { Component } from 'react'
import { Form, FormGroup, Col, InputGroup } from 'react-bootstrap'
import { validateUname, isAValidEmailAddress, randomPassword, validatePassword } from '../util/belt'
import socket from '../socket'
import { browserHistory } from 'react-router'
import userInfo from '../core/user-info';
import notification from '../core/notification'
import Recaptcha from './recaptcha'


function validateLegalAge(selection) {
  if (!selection) {
    return 'You must be of legal age and in a jurisdiction where gambling is legal.';
  }
}


class Register extends Component {
  constructor(props) {
    super(props);
    this.unmounted = false;
		this.firstInput = null; // this is a ref
		this.getRecaptchaResponse = null;

    this.state = {
      uname: '',
      email: '',
      emailSelected: true,
      password: randomPassword(10),
      legalAge: false,
      error: null,
      unameError: null,
      emailError: null,
      passwordError: null,
      legalAgeError: null,
			submitting: false,
			touched: false
    };
  }

	componentDidMount(){
		this.firstInput.focus();
	}

	componentWillUnmount() {
		this.unmounted = true;
	}

  validateEmail(email) {
    if (this.state.emailSelected && !email)
      return 'Please enter an email.';

    if (this.state.emailSelected && !isAValidEmailAddress(email))
      return 'This does not look like a valid email.'
  }

// this returns true if the form is valid
  validate(values) {
    let isValid = true;

    const unameError = validateUname(values.uname);
    this.setState({
      unameError
    });
    isValid = isValid && !unameError;

    const passwordError = validatePassword(values.password);
    this.setState({
      passwordError
    });
    isValid = isValid && !passwordError;

    const emailError = this.validateEmail(values.email);
    this.setState({
      emailError
    });
    isValid = isValid && !emailError;

    const legalAgeError = validateLegalAge(values.legalAge);
    this.setState({
      legalAgeError
    });
    isValid = isValid && !legalAgeError;

    return isValid;
  }

  onUnameChange(event) {
    const uname = event.target.value;
    const unameError = this.state.touched ? validateUname(uname) : null;
    this.setState({uname, unameError});
  }

	onPasswordChange(event) {
		const password = event.target.value;
		const passwordError = this.state.touched ? validatePassword(password) : null;
		this.setState({password, passwordError});
	}

  onEmailChange(event) {
    const email = event.target.value;
    const emailError = this.state.touched ? this.validateEmail(email) : null;
    this.setState({email, emailError});
  }

  changeEmailSelected(emailSelected) {
  this.setState({emailSelected});
}
  changeLegalAgeSelected() {
    this.setState({legalAge: !this.state.legalAge});
  }

  handleSubmit(event) {
    event.preventDefault();
    let { uname, password, email } = this.state;


    if (!this.validate(this.state)) return;

    this.getRecaptchaResponse(recaptchaResponse => {

			this.setState({ submitting: true, touched: true });

			socket
				.send('register', { uname, password, email, recaptchaResponse })
				.then(info => {
					this.setState({ submitting: false });
					browserHistory.push('/');
					userInfo.initialize(info.userInfo);
					localStorage.setItem('secret', info.sessionId);
					notification.setMessage('<span><span className="green-tag">Welcome {uname}! </span> You are successfully registered.</span>');
				}, err => {
					this.setState({ submitting: false });
					switch (err) {
						case 'USERNAME_TAKEN':
							this.setState({
								unameError: 'This username is taken. Please choose a different one.'
							});
							break;
						default:
							notification.setMessage('<span><span className="red-tag">Error </span> Unexpected server error: {err}.</span>', 'error');
					}
				})

		});


  }

  generate() {
    this.setState({password: randomPassword(10)});
  }


  render() {

    const styles = {
      container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        flexDirection: 'column',
				marginTop: '20px'
      }
    };

    const { unameError, emailError, passwordError, emailSelected, legalAge, legalAgeError }  = this.state;

    return (
    <div style={styles.container}>
      <Form horizontal onSubmit={(event) => this.handleSubmit(event)}>
        <Col xs={24} xsOffset={0} sm={20} smOffset={2} md={16} mdOffset={4}>
          { unameError && <strong className="red-error">{unameError}</strong>}
          <FormGroup className={unameError ? 'has-error' : ''}>
            <InputGroup>
              <InputGroup.Addon>
                Username:
              </InputGroup.Addon>
              <input type="text"
                     className="form-control"
                     value={this.state.uname}
										 ref={(input) => { this.firstInput = input; }}
                     onChange={(event) => this.onUnameChange(event)}
              />
            </InputGroup>
          </FormGroup>
        </Col>
        <Col xs={24} xsOffset={0} sm={20} smOffset={2} md={16} mdOffset={4}>
          { passwordError && <strong className="red-error">{passwordError}</strong>}
          <FormGroup className={passwordError ? 'has-error' : ''}>
            <InputGroup>
              <InputGroup.Addon>
                Password:
              </InputGroup.Addon>
              <input name="password"
                     type="text"
                     className="form-control"
                     readOnly
                     value={this.state.password}
										 onChange={(event) => this.onPasswordChange(event)}
              />
              <InputGroup.Button>
                <button className="btn btn-default form-control" type="button" onClick={() => this.generate()}>
                  <i className="fa fa-refresh"></i>
                </button>
              </InputGroup.Button>
            </InputGroup>
          </FormGroup>
        </Col>
        <Col xs={24} xsOffset={0} sm={20} smOffset={2} md={16} mdOffset={4}>
          <h5 className="title">Account Recovery Options</h5>
        </Col>
        <Col xs={24} xsOffset={0} sm={20} smOffset={2} md={16} mdOffset={4}>
          <div className="radio">
            <label>
              <input type="radio"
                     name="recoveryEmail"
                     value="email"
                     checked={emailSelected}
                     onChange={() => this.changeEmailSelected(true)}
              />
              { emailError && <strong className="red-error">{emailError}</strong>}
              <FormGroup style={{marginLeft: '0px'}} className={emailError ? 'has-error' : ''}>
                <InputGroup>
                  <InputGroup.Addon>
                    Email:
                  </InputGroup.Addon>
                  <input type="text"
                         name="email"
                         className="form-control"
                         value={this.state.email}
                         onChange={(event) => this.onEmailChange(event)}
                  />
                </InputGroup>
              </FormGroup>
            </label>
          </div>
          <div className="radio">
            <label>
              <input type="radio"
                     name="recoveryEmail"
                     value="no-email"
                     checked={!emailSelected}
                     onChange={() => this.changeEmailSelected(false)}

              />
                I don't want a way to recover my account. If I forget my password, please lock my account permanently.
            </label>
          </div>
        </Col>
        <Col xs={24} xsOffset={0} sm={20} smOffset={2} md={16} mdOffset={4} style={{marginBottom: '25px'}}>
          <hr />
          { legalAgeError && <strong className="red-error">{legalAgeError}</strong>}
          <div className="checkbox">
            <label>
              <input type="checkbox"
                     name="legalAge"
                     checked={legalAge}
                     onChange={() => this.changeLegalAgeSelected()}

              />
              I am 18 or older, and gambling is legal in my jurisdiction.
            </label>
          </div>
        </Col>
        <Col xs={24} xsOffset={0} sm={20} smOffset={2} md={16} mdOffset={4} style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <button type="submit"
                  className='btn btn-success btn-lg'
                  style={{marginTop: '25px'}}
									disabled={ this.state.submitting }
					>
						{ this.state.submitting ? <i className="fa fa-spinner fa-pulse fa-fw"></i> : 'Submit'}
          </button>
        </Col>
      </Form>
			<Recaptcha responder={ r => this.getRecaptchaResponse = r } />
		</div>

    )
  }
}


export default Register;
