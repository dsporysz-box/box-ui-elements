// @flow
import * as React from 'react';
import classNames from 'classnames';
import omit from 'lodash/omit';
import { FormattedMessage } from 'react-intl';

import messages from 'common/messages';
import TextInput from '../text-input';
import Button from '../button';

import './TextInputWithCopyButton.scss';

const DEFAULT_SUCCESS_STATE_DURATION = 3000;

const defaultCopyText = <FormattedMessage {...messages.copy} />;
const defaultCopiedText = <FormattedMessage {...messages.copied} />;

type Props = {
    /** Set the focus to input when component loads */
    autofocus?: boolean,
    /** Default copy button text */
    buttonDefaultText: string | React.Node,
    /** Copy button text when copy is successful */
    buttonSuccessText?: string | React.Node,
    buttonProps?: Object,
    className: string,
    disabled?: boolean,
    /** Label displayed for the text input */
    // TODO: Make label required
    label?: React.Node,
    /** onFocus handler for the input el */
    onFocus?: Function,
    /** Function called when link is copied by keyboard or button */
    onCopySuccess?: Function,
    /** Duration (milliseconds) in which to show the copy success state */
    successStateDuration: number,
    /** trigger the copy animation when the component loads (used to simulate a click on copy button) */
    triggerCopyOnLoad?: boolean,
    /** html input types (email, url, text, number), defaults to 'text' */
    type: string,
    /** Value of the text input */
    value: React.Node,
};

type State = {
    copySuccess: boolean,
    buttonText: string | React.Node,
    hasFocused: boolean,
};

class TextInputWithCopyButton extends React.PureComponent<Props, State> {
    static defaultProps = {
        buttonDefaultText: defaultCopyText,
        buttonProps: {},
        buttonSuccessText: defaultCopiedText,
        className: '',
        hideOptionalLabel: true,
        readOnly: true,
        successStateDuration: DEFAULT_SUCCESS_STATE_DURATION,
        type: 'text',
    };

    constructor(props: Props) {
        super(props);

        // $FlowFixMe https://github.com/facebook/flow/issues/4335
        this.isCopyCommandSupported = document.queryCommandSupported('copy');

        this.state = {
            copySuccess: false,
            buttonText: props.buttonDefaultText,
            hasFocused: false,
        };
    }

    componentDidMount() {
        const { autofocus, value } = this.props;

        if (autofocus && value) {
            this.performAutofocus();
        }
    }

    componentDidUpdate() {
        const { autofocus, value, triggerCopyOnLoad } = this.props;
        const { copySuccess, hasFocused } = this.state;

        // if we've set focus before, and should auto focus on update, make sure to
        // focus after component update
        if (autofocus && value) {
            this.performAutofocus();
        }

        if (triggerCopyOnLoad && !copySuccess && !hasFocused) {
            this.animateCopyButton();
        }
    }

    componentWillUnmount() {
        this.clearCopySuccessTimeout();
    }

    copyInputRef: ?HTMLInputElement;

    copySuccessTimeout: ?TimeoutID;

    isCopyCommandSupported: boolean;

    animateCopyButton() {
        const { successStateDuration, buttonSuccessText } = this.props;
        this.clearCopySuccessTimeout();

        this.setState(
            {
                copySuccess: true,
                buttonText: buttonSuccessText,
                hasFocused: true,
            },
            () => {
                this.copySuccessTimeout = setTimeout(() => {
                    this.restoreCopyButton();
                }, successStateDuration);
            },
        );
    }

    clearCopySuccessTimeout() {
        if (!this.copySuccessTimeout) {
            return;
        }
        clearTimeout(this.copySuccessTimeout);
        this.copySuccessTimeout = null;
    }

    copySelectedText = () => document.execCommand('copy');

    restoreCopyButton = () => {
        this.setState({
            copySuccess: false,
            buttonText: this.props.buttonDefaultText,
        });
    };

    handleCopyButtonClick = () => {
        this.performAutofocus();
        this.copySelectedText();
        this.animateCopyButton();
    };

    handleFocus = (event: SyntheticEvent<>) => {
        if (this.copyInputRef) {
            this.copyInputRef.select();
        }

        if (this.props.onFocus) {
            this.props.onFocus(event);
        }
    };

    handleCopyEvent = (event: SyntheticEvent<>) => {
        this.animateCopyButton();

        const { onCopySuccess } = this.props;
        if (onCopySuccess) {
            onCopySuccess(event);
        }
    };

    performAutofocus = () => {
        if (this.copyInputRef) {
            this.copyInputRef.select();
        }
    };

    renderCopyButton = () =>
        this.isCopyCommandSupported ? (
            <Button
                onClick={this.handleCopyButtonClick}
                type="button"
                isDisabled={this.props.disabled}
                {...this.props.buttonProps}
            >
                {this.state.buttonText}
            </Button>
        ) : null;

    render() {
        const { className, ...rest } = this.props;
        const { copySuccess } = this.state;
        const { isCopyCommandSupported } = this;

        const inputProps = omit(rest, [
            'autofocus',
            'buttonDefaultText',
            'buttonSuccessText',
            'buttonProps',
            'onCopySuccess',
            'successStateDuration',
            'triggerCopyOnLoad',
        ]);

        if (isCopyCommandSupported) {
            inputProps.inputRef = ref => {
                this.copyInputRef = ref;
            };
        }

        const wrapperClasses = classNames(className, {
            'copy-success': copySuccess,
            'text-input-with-copy-button-container': isCopyCommandSupported,
        });

        const copyEvent = isCopyCommandSupported ? { onCopy: this.handleCopyEvent } : {};

        return (
            <div className={wrapperClasses} {...copyEvent}>
                <TextInput {...inputProps} onFocus={this.handleFocus} />
                {this.renderCopyButton()}
            </div>
        );
    }
}

export default TextInputWithCopyButton;
