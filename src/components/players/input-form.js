import React from 'react';

const InputForm = (props) => {
    return (
        <form onSubmit={props.handleSubmit}>
        <input
            placeholder="Add your name here"
            onChange={props.handleChange}
            value={props.value}
        />
        <button>Add #{props.length}</button>
    </form>
    );
}

export default InputForm;