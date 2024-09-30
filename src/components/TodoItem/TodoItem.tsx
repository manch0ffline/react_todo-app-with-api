import React, { useRef, useState } from 'react';
import cn from 'classnames';

import { Todo } from '../../types/Todo';
import { deleteTodo, updateTodo } from '../../api/todos';
import { showErrorMesage } from '../../utils/showErrorMesage';

type Props = {
  todo: Todo;
  todosFunction: (el: Todo[]) => void;
  errorFunction: (el: string) => void;
  deletingFunction: (el: boolean) => void;
  deletingListId: number[];
  todos: Todo[];
  focusInput: () => void;
  activateTodosId: number[];
};

export const TodoItem: React.FC<Props> = ({
  todo,
  todosFunction,
  errorFunction,
  deletingFunction,
  deletingListId,
  todos,
  focusInput,
  activateTodosId,
}) => {
  const { id, completed, title } = todo;

  const [loader, setLoader] = useState(false);
  const [loadingTodoId, setLoadingTodoId] = useState<number | null>(null);

  const [isChangeInput, setIsChangeInput] = useState(false);
  const [changeInputText, setChangeInputText] = useState(title);

  const isDeleting = deletingListId.includes(id);

  const inputRefChange = useRef<HTMLInputElement>(null);

  const handleDeleteBtn = (todoId: number) => {
    setLoader(true);
    deletingFunction(true);

    deleteTodo(id)
      .then(() => {
        const updatedTodos = todos.filter((td: Todo) => td.id !== todoId);

        todosFunction(updatedTodos);
      })
      .catch(er => {
        showErrorMesage('Unable to delete a todo', errorFunction);
        throw er;
      })
      .finally(() => {
        setLoader(false);
        deletingFunction(false);
        setTimeout(() => focusInput(), 0);
        setChangeInputText('');
      });
  };

  const handleInputCheckbox = (todoId: number) => {
    setLoadingTodoId(todoId);

    updateTodo({ ...todo, completed: !todo.completed })
      .then(updatedTodo => {
        const updatedTodos = todos.map(td =>
          td.id === updatedTodo.id ? updatedTodo : td,
        );

        todosFunction(updatedTodos);
      })
      .catch(er => {
        showErrorMesage('Unable to update a todo ', errorFunction);
        throw er;
      })
      .finally(() => {
        setLoadingTodoId(null);
      });
  };

  const isLoading =
    loadingTodoId === todo.id ||
    activateTodosId.includes(todo.id) ||
    isDeleting ||
    loader;

  const updateTodoFunction = () => {
    if (changeInputText === title) {
      setIsChangeInput(false);

      return;
    }

    setLoader(true);

    if (changeInputText.trim() === '') {
      deletingFunction(true);

      deleteTodo(id)
        .then(() => {
          const updatedTodos = todos.filter((td: Todo) => td.id !== id);

          todosFunction(updatedTodos);
          setTimeout(() => focusInput(), 0);
          setIsChangeInput(false);
          setChangeInputText('');
        })
        .catch(er => {
          showErrorMesage('Unable to update a todo', errorFunction);

          if (inputRefChange.current) {
            inputRefChange.current.focus();
          }

          throw er;
        })
        .finally(() => {
          setLoader(false);
          deletingFunction(false);
        });

      return;
    }

    updateTodo({ ...todo, title: changeInputText.trim() })
      .then(updatedTodo => {
        const updatedTodos = todos.map(td =>
          td.id === updatedTodo.id ? updatedTodo : td,
        );

        todosFunction(updatedTodos);
        setIsChangeInput(false);
        setChangeInputText('');
      })
      .catch(er => {
        showErrorMesage('Unable to update a todo ', errorFunction);

        if (inputRefChange.current) {
          inputRefChange.current.focus();
        }

        throw er;
      })
      .finally(() => {
        setLoader(false);
      });
  };

  const handleChangedForm: React.FormEventHandler<HTMLFormElement> = ev => {
    ev.preventDefault();

    updateTodoFunction();
  };

  const handleKeyDown = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === 'Escape') {
      setIsChangeInput(false);
      setChangeInputText('');
    }
  };

  return (
    <div
      data-cy="Todo"
      className={cn('todo', { completed: todo.completed })}
      key={id}
    >
      <label className="todo__status-label" htmlFor={`todo-status-${id}`}>
        <input
          data-cy="TodoStatus"
          id={`todo-status-${id}`}
          type="checkbox"
          className="todo__status"
          checked={completed}
          onChange={() => {
            handleInputCheckbox(id);
          }}
        />
        <span className="sr-only">
          Mark as {completed ? 'incomplete' : 'complete'}
        </span>
      </label>
      {isChangeInput ? (
        <form onSubmit={handleChangedForm}>
          <input
            autoFocus
            data-cy="TodoTitleField"
            type="text"
            className="todo__title-field"
            placeholder="Empty todo will be deleted"
            value={changeInputText}
            onChange={ev => setChangeInputText(ev.target.value)}
            onBlur={updateTodoFunction}
            onKeyDown={handleKeyDown}
            ref={inputRefChange}
          />
        </form>
      ) : (
        <>
          <span
            data-cy="TodoTitle"
            className="todo__title"
            onDoubleClick={() => {
              setIsChangeInput(true);
              setChangeInputText(title);
            }}
          >
            {title}
          </span>
          <button
            type="button"
            className="todo__remove"
            data-cy="TodoDelete"
            onClick={() => {
              handleDeleteBtn(todo.id);
            }}
          >
            ×
          </button>
        </>
      )}

      <div
        data-cy="TodoLoader"
        className={cn('modal overlay', {
          'is-active': isLoading,
        })}
      >
        {/* eslint-disable-next-line max-len */}
        <div className="modal-background has-background-white-ter" />
        {/* eslint-enable max-len */}
        <div className="loader" />
      </div>
    </div>
  );
};
