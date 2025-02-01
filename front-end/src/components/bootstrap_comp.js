import React from 'react';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './style_login.css';

export const DropdownButton = ({ title, items, value, onChange }) => {
    const [dropdownOpen, setDropdownOpen] = React.useState(false);
    const [selectedItem, setSelectedItem] = React.useState(value || title);

    const toggle = () => setDropdownOpen(prevState => !prevState);
    const handleSelect = (item) => {
        setSelectedItem(item);
        onChange(item);
    };

    return (
        <Dropdown isOpen={dropdownOpen} toggle={toggle}>
            <DropdownToggle caret>
                {selectedItem}
            </DropdownToggle>
            <DropdownMenu className="dropdown-menu-scrollable">
                {items.map((item, index) => (
                    <DropdownItem key={index} onClick={() => handleSelect(item)}>
                        {item}
                    </DropdownItem>
                ))}
            </DropdownMenu>
        </Dropdown>
    );
};
