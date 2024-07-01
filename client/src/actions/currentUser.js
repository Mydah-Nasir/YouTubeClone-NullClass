export const setCurrentUser =(data)=>{
    return {
        type:'FETCH_CURRENT_USER',
        payload:data
    }
}

// Action Types
export const UPDATE_USER = 'UPDATE_USER';

// Action Creators
export const updateUser = (updatedUser) => ({
  type: UPDATE_USER,
  payload: updatedUser,
});