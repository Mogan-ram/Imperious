import React from 'react';
import { Dropdown } from 'react-bootstrap';

export const DropdownButton = ({ title, items, value, onChange }) => {
    return (
        <Dropdown>
            <Dropdown.Toggle variant="light" className="w-100 text-start">
                {value || title}
            </Dropdown.Toggle>
            <Dropdown.Menu className="w-100 dropdown-menu-scrollable">
                {items.map((item) => (
                    <Dropdown.Item
                        key={item}
                        onClick={() => onChange(item)}
                        active={value === item}
                    >
                        {item}
                    </Dropdown.Item>
                ))}
            </Dropdown.Menu>
        </Dropdown>
    );
}; 