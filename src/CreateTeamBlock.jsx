import React, { useState, useEffect, useContext } from 'react';
import Cookies from 'js-cookie';
import { DataContext } from './DataContext';

const CreateTeamBlock = () => {

    const { teams, addTeamData, deleteTeamData } = useContext(DataContext);
    const [inputData, setInputData] = useState({
        teamName: '',
        auto_init: true
    });

    const [errors, setErrors] = useState({});

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInputData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!inputData.teamName) {
            newErrors.teamName = '團隊名稱是必填項';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateForm()) {
            return;
        }

        const teamName = inputData.teamName;
        const owner = Cookies.get('username');
        const token = Cookies.get('token');

        addTeamData(teamName, owner, token);
        setInputData({
            teamName: '',
            auto_init: true
          });
    };

    return (
        <div className="w-full flex justify-center items-center">
            <form id="createTeamForm" onSubmit={handleSubmit} className='bg-indigo-50 shadow-xl p-2 rounded-2xl w-[400px] h-[250px] flex flex-col items-center justify-center'>
                <div className="w-[300px] mb-7">
                    <input
                        className=' p-2 border border-slate-50 rounded-md h-12 text-xl'
                        type="text"
                        name="teamName"
                        value={inputData.teamName}
                        onChange={handleInputChange}
                        placeholder="團隊名稱"
                    />
                    {errors.teamName && <span className="error">{errors.teamName}</span>}
                </div>
                <button type="submit" className="bg-buttonBlue text-white w-44 h-12 rounded-full text-2xl mt-4 hover:bg-buttonBlue-dark">創建團隊</button>
            </form>
        </div>
    );
};

export default CreateTeamBlock;
